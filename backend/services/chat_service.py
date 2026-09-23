"""The learning assistant: builds a child-safe, personalised prompt from the child's
stored context and asks Gemini (or an offline helper when Gemini is unavailable).

Privacy: the child's name, parent details and ids are never sent to Gemini, and
emails/phone numbers typed by the child are redacted first."""
import random
import re
from datetime import datetime, timedelta, timezone

from middleware import get_repo
from services import gemini_client, learning_service as ls, regions_service as rs
from services.games_service import game_by_key
from validators import clean_text, redact_personal_info, require

LANG_NAMES = {"en": "English", "fr": "French", "ar": "Arabic"}
HISTORY_TURNS = 8
SESSION_TTL = timedelta(hours=6)


def _game_state(value):
    """Untrusted, informational only: how the child is doing in the current game."""
    value = value if isinstance(value, dict) else {}
    num = lambda k: max(0, min(int(value.get(k) or 0), 99)) if str(value.get(k) or 0).isdigit() else 0  # noqa: E731
    return {"mistakes": num("mistakes"), "hints": num("hints"), "note": clean_text(value.get("note"), 160)}


def _context(child, lesson_key=None, game_key=None, question_id=None, game_state=None):
    repo = get_repo()
    theme = ls.theme_for(child)
    overview = ls.lessons_overview(child)
    lesson = next((l for l in overview if l["key"] == lesson_key), None) if lesson_key else None
    game = None
    if game_key:
        game = next((g for g in repo.select("mk_games", key=game_key)), None)
    question = repo.get("mk_questions", question_id) if question_id and len(str(question_id)) == 36 else None
    if question and not (question["region_key"] in rs.unlocked_region_keys(child) if question.get("kind") == "region"
                         else question["lesson_id"] in ls.unlocked_lesson_ids(child["id"])):
        question = None
    s = ls.stats(child["id"])
    nxt = ls.next_lesson(child)
    trip = rs.journey(child)
    return {
        "theme": theme, "lesson": lesson, "game": game, "question": question,
        "age": child.get("age"), "age_band": child.get("age_band") or "6-8",
        "difficulty": ls.difficulty(child), "reading_level": ls.reading_level(child),
        "language": LANG_NAMES.get(child.get("language") or "en", "English"),
        "interests": child.get("interests") or [], "learning_style": child.get("learning_style") or "watch",
        "rug_style": ls.rug_style_for(child)["name"],
        "completed": [l["title"] for l in overview if l["status"] == "completed"],
        "next_lesson": nxt["title"] if nxt else None, "points": s["total_points"], "xp_level": s["xp_level"],
        "regions_now": [f"{r['name']} ({r['style']})" for r in (rs.lesson_regions(child, lesson_key) if lesson_key else trip["current"])],
        "regions_visited": [r["name"] for r in trip["route"] if r["status"] == "visited"],
        "skills": ((child.get("learning_profile") or {}).get("skills") or {}),
        "game_state": _game_state(game_state),
    }


def build_system_prompt(ctx):
    t, v = ctx["theme"], ctx["theme"]["vocab"]
    max_sentences = 2 if ctx["age_band"] == "3-5" else 4 if ctx["age_band"] == "6-8" else 5
    lines = [
        "You are MyRugy, the friendly guide of MyRugy Kids (a little woven rug with a smiling face), an app that "
        "teaches children how traditional Moroccan rugs are made (materials, tools, design, weaving, finishing, symbols). "
        f"The child is currently exploring the {t['name']} world with {t['guide']['name']} {t['guide']['emoji']}.",
        "You are a companion and tutor INSIDE the existing games: you explain, demonstrate with words, give hints, "
        "answer questions and encourage. You never play for the child, never decide if an answer is right, never "
        "change the game or its rules, never promise rewards, and never choose which game to play.",
        "RULES:",
        f"- The learner is a child aged {ctx['age'] or ctx['age_band']} (difficulty: "
        f"{['', 'beginner', 'explorer', 'master'][ctx['difficulty']]}). Use very simple words and at most "
        f"{max_sentences} short sentences. One idea at a time.",
        f"- Always reply in {ctx['language']}.",
        f"- Make examples fit their world: {t['name']} (friends: {v['friend']}, places: {v['place']}, "
        f"treasures: {v['collect']}). Keep facts about rugs accurate.",
        "- Only talk about rug making, weaving, Moroccan crafts and the lessons. If asked about anything else, "
        "kindly steer back to the lesson.",
        "- Never ask for or repeat personal information (full name, address, school, phone, photos, passwords). "
        "If the child shares some, tell them gently to keep it private.",
        "- No links, no scary or violent content, no medical/legal advice. If the child seems upset or unsafe, "
        "tell them to talk to a grown-up they trust.",
        "- Be encouraging. Praise effort. Explain mistakes kindly. End with a small question or a next step when useful.",
        "- Plain text only, no markdown. Emojis are fine (at most 2).",
        "- Adapt: after one mistake say it is almost there; after repeated mistakes make it simpler (focus on one "
        "small part); after success, celebrate what they noticed. Never make the child feel bad.",
    ]
    if ctx["question"]:
        q = ctx["question"]
        lines += [
            "QUIZ MODE: the child is answering this question right now:",
            f'  "{q["prompt"]}" (choices: {", ".join(q["options"])})',
            f"  Teacher's hint: {q['hint']}",
            "- NEVER say which choice is correct, never eliminate choices one by one, and never confirm a guess. "
            "Give a hint or a guiding question that helps them think, based on the lesson.",
        ]
    info = [f"Learning style: {ctx['learning_style']}", f"Favourite rug style: {ctx['rug_style']}",
            f"Interests: {', '.join(ctx['interests']) or 'unknown'}",
            f"Points: {ctx['points']} {v['points']} (level {ctx['xp_level']})",
            f"Lessons completed: {', '.join(ctx['completed']) or 'none yet'}"]
    if ctx["lesson"]:
        info.append(f"Current lesson: {ctx['lesson']['title']}: {ctx['lesson']['summary']}")
    if ctx["game"]:
        info.append(f"Current game: {ctx['game']['title']}")
    if ctx["next_lesson"]:
        info.append(f"Suggested next lesson: {ctx['next_lesson']}")
    if ctx["regions_now"]:
        info.append(f"Current Moroccan region(s) on their journey: {', '.join(ctx['regions_now'])}. Use this region's weaving style in examples.")
    if ctx["skills"]:
        good = [k.replace("_", " ") for k, v in ctx["skills"].items() if v == "strong"]
        practise = [k.replace("_", " ") for k, v in ctx["skills"].items() if v == "practice"]
        info.append(f"Strengths: {', '.join(good) or 'still discovering'}; practising: {', '.join(practise) or 'nothing special'}")
    gs = ctx["game_state"]
    if ctx["game"] and (gs["mistakes"] or gs["hints"]):
        info.append(f"In this game so far: {gs['mistakes']} mistake(s), {gs['hints']} hint(s) used. {gs['note']}".strip())
    if ctx["regions_visited"]:
        info.append(f"Regions already visited: {', '.join(ctx['regions_visited'])}")
    lines += ["CHILD CONTEXT:", *(f"- {i}" for i in info)]
    return "\n".join(lines)


def _offline_reply(ctx, message):
    """Used when no Gemini key is configured or Gemini is unavailable."""
    t = ctx["theme"]
    if ctx["question"]:
        return f"Here's a hint: {ctx['question']['hint']} Take your time, you can do it! 💪"
    text = message.lower()
    facts = {
        r"wool|sheep|laine": "Most Moroccan rugs are made from sheep's wool: it's soft, warm and strong! 🐑",
        r"loom|métier": "A loom is a big wooden frame that holds the threads tight while you weave. 🪵",
        r"dye|colou?r|couleur|indigo|henna": "Weavers make colours from plants: indigo for blue, henna for orange-red. 🌿",
        r"knot|noeud|nœud": "The weaver ties tiny knots of yarn on the warp threads, one by one! 🪢",
        r"warp|weft|chaîne|trame": "Warp threads go up and down; the weft goes across to hold each row. 🧵",
        r"comb|peigne": "The weaving comb presses each row down tight. Tap, tap, tap! 🪮",
        r"pattern|symmetr|motif|diamond|losange": "Patterns repeat, and symmetry means both sides match like a mirror. 🔷",
    }
    for pattern, fact in facts.items():
        if re.search(pattern, text):
            return fact
    if ctx["lesson"]:
        return f"We're learning about {ctx['lesson']['title']}: {ctx['lesson']['summary']} What would you like to know? {t['guide']['emoji']}"
    if ctx["next_lesson"]:
        return f"{t['vocab']['cheer']}! Ready for the next lesson, {ctx['next_lesson']}? {t['guide']['emoji']}"
    return random.choice(["Ask me anything about how rugs are made! 🧶", "Do you know what a loom is? Ask me! 🪵"])


def _session(child, lesson_key):
    repo = get_repo()
    cutoff = datetime.now(timezone.utc) - SESSION_TTL
    sessions = [s for s in repo.select("mk_chat_sessions", child_id=child["id"])
                if s.get("lesson_key") == lesson_key
                and datetime.fromisoformat(str(s["created_at"]).replace("Z", "+00:00")) > cutoff]
    if sessions:
        return max(sessions, key=lambda s: s["created_at"])
    return repo.insert("mk_chat_sessions", {"child_id": child["id"], "lesson_key": lesson_key})


def reply(child, message, lesson_key=None, game_key=None, question_id=None, game_state=None):
    repo = get_repo()
    message = clean_text(message, 500)
    require(message, "Type a question first")
    if lesson_key is not None:
        ls.lesson_by_key(lesson_key)  # 404 on unknown keys
    if game_key is not None:
        game_by_key(game_key)
    ctx = _context(child, lesson_key, game_key, question_id, game_state)
    session = _session(child, lesson_key)
    history = sorted(repo.select("mk_chat_messages", session_id=session["id"]), key=lambda m: m["created_at"])
    history = [{"role": m["role"], "content": m["content"]} for m in history[-HISTORY_TURNS * 2:]]
    safe_message = redact_personal_info(message)

    source = "gemini"
    try:
        answer = gemini_client.generate(build_system_prompt(ctx), history, safe_message)
    except gemini_client.GeminiBlocked:
        answer, source = "Let's keep our chat about rugs and weaving! What would you like to learn? 🧶", "filtered"
    except gemini_client.GeminiUnavailable:
        answer, source = _offline_reply(ctx, safe_message), "offline"
    answer = clean_text(answer.replace("**", "").replace("__", ""), 1200, allow_newlines=True)

    repo.insert("mk_chat_messages", {"session_id": session["id"], "child_id": child["id"], "role": "user", "content": safe_message})
    repo.insert("mk_chat_messages", {"session_id": session["id"], "child_id": child["id"], "role": "assistant", "content": answer})
    return {"reply": answer, "source": source, "guide": {"name": "MyRugy", "emoji": "🧶"}}


def history(child, lesson_key=None):
    repo = get_repo()
    sessions = [s for s in repo.select("mk_chat_sessions", child_id=child["id"]) if s.get("lesson_key") == lesson_key]
    if not sessions:
        return []
    latest = max(sessions, key=lambda s: s["created_at"])
    messages = sorted(repo.select("mk_chat_messages", session_id=latest["id"]), key=lambda m: m["created_at"])
    return [{"role": m["role"], "content": m["content"]} for m in messages[-20:]]
