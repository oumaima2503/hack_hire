"""Personalised learning: turns a child's stored choices into their experience,
and owns progress, points, unlocks and achievements.

Nothing here trusts the browser: points are computed from server-side rules and
the ledger, answers are checked against the database."""
import random
import re
from datetime import datetime, timedelta, timezone

import config
from learning_content import (BASE_THEMES, COLORS, DIFFICULTY_LABELS, LEARNING_STYLES, RUG_STYLES,
                              THEME_FROM_INTEREST, THEMES)
from middleware import get_repo
from repository import now_iso
from services import regions_service as rs
from validators import ApiError, require

THEME_DEFAULT_COLOR = {"space": "blue", "ocean": "blue", "dinosaurs": "green", "jungle": "green",
                       "desert": "orange", "fairytale": "purple", "magic": "purple"}
QUIZ_SIZE = {1: 2, 2: 3, 3: 4}


# ───────────────────────── Profile → personalisation ─────────────────────────

def age_band_for(age):
    return "3-5" if age <= 5 else "6-8" if age <= 8 else "9-11"


def difficulty(child):
    """Game difficulty 1-3: measured by the onboarding mini-challenges, editable by the parent.
    Capped at 2 for 3-5 year olds."""
    level = child.get("level") or 1
    return min(level, 2) if child.get("age_band") == "3-5" else level


def reading_level(child):
    band = child.get("age_band")
    if band == "3-5":
        return 1
    if band == "9-11":
        return max(difficulty(child), 2)
    return difficulty(child)


def speed_seconds(child):
    """Seconds per question in timed games; no timer for the youngest or beginners."""
    if child.get("age_band") == "3-5":
        return None
    return {1: None, 2: 30, 3: 20}[difficulty(child)]


def unlocked_rewards(child_id):
    repo = get_repo()
    ids = {r["reward_id"] for r in repo.select("mk_child_rewards", child_id=child_id)}
    return [r for r in repo.select("mk_rewards") if r["id"] in ids]


def available_themes(child_id):
    extra = [r["payload"]["theme"] for r in unlocked_rewards(child_id) if r["kind"] == "theme"]
    return list(BASE_THEMES) + extra


def theme_key(child):
    selected = child.get("selected_theme")
    if selected in BASE_THEMES or (selected in THEMES and selected in available_themes(child["id"])):
        return selected
    for interest in child.get("interests") or []:
        if interest in THEME_FROM_INTEREST:
            return THEME_FROM_INTEREST[interest]
    return "desert"


def theme_for(child):
    key = theme_key(child)
    theme = {**THEMES[key], "key": key}
    color_key = child.get("favorite_color") if child.get("favorite_color") in COLORS else THEME_DEFAULT_COLOR[key]
    theme["colors"] = {**theme["colors"], "primary": COLORS[color_key]["hex"], "on_primary": COLORS[color_key]["on"]}
    return theme


def rug_style_for(child):
    key = child.get("rug_style") if child.get("rug_style") in RUG_STYLES else "berber"
    return {**RUG_STYLES[key], "key": key}


def child_palette(child, extra=()):
    """Favourite colour first, then the rug style's colours, the theme accent, basics, unlocks."""
    theme = theme_for(child)
    colors = [theme["colors"]["primary"], *rug_style_for(child)["colors"], theme["colors"]["secondary"],
              "#ffffff", "#2a1a10", *extra]
    seen, out = set(), []
    for c in colors:
        if c.lower() not in seen:
            seen.add(c.lower())
            out.append(c.lower())
    return out


def fill_vocab(template, theme):
    if not template:
        return ""
    text = template.format(**theme["vocab"])
    return re.sub(r"\b([Aa]) (?=[aeiouAEIOU])", r"\1n ", text)  # "a astronaut" → "an astronaut"


# ───────────────────────── Stats, points, unlocks ─────────────────────────

def _day(ts):
    return datetime.fromisoformat(str(ts).replace("Z", "+00:00")).astimezone(timezone.utc).date()


def _today():
    return datetime.now(timezone.utc).date()


def streak_days(ledger):
    days = {_day(e["created_at"]) for e in ledger}
    day = _today() if _today() in days else _today() - timedelta(days=1)
    streak = 0
    while day in days:
        streak += 1
        day -= timedelta(days=1)
    return streak


def xp(total):
    return {"xp_level": total // config.POINTS_PER_LEVEL + 1,
            "points_to_next": config.POINTS_PER_LEVEL - total % config.POINTS_PER_LEVEL,
            "points_per_level": config.POINTS_PER_LEVEL}


def stats(child_id):
    repo = get_repo()
    ledger = repo.select("mk_points_ledger", child_id=child_id)
    answers = repo.select("mk_child_answers", child_id=child_id)
    games = repo.select("mk_child_game_progress", child_id=child_id)
    challenge = next((g for g in repo.select("mk_games") if g["type"] == "challenge"), None)
    total = sum(e["points"] for e in ledger)
    return {
        "total_points": total,
        **xp(total),
        "lessons_completed": sum(1 for p in repo.select("mk_child_progress", child_id=child_id) if p["status"] == "completed"),
        "lessons_total": len(repo.select("mk_lessons")),
        "games_completed": sum(1 for g in games if g["completed"]),
        "correct_answers": len({a["question_id"] for a in answers if a["correct"]}),
        "answers_total": len(answers),
        "answers_correct": sum(1 for a in answers if a["correct"]),
        "rugs_created": len(repo.select("mk_created_rugs", child_id=child_id)),
        "challenge_passed": int(any(g["completed"] and challenge and g["game_id"] == challenge["id"] for g in games)),
        "streak_days": streak_days(ledger),
        "items_unlocked": len(repo.select("mk_child_rewards", child_id=child_id)),
        "achievements": len(repo.select("mk_child_achievements", child_id=child_id)),
        "regions_visited": rs.visited_count(child_id),
    }


def public_reward(r):
    return {k: r[k] for k in ("key", "kind", "name", "emoji", "threshold", "payload")}


def public_achievement(a):
    return {k: a[k] for k in ("key", "title", "description", "emoji")}


def _sync(child):
    """Recompute totals, then grant any newly reached rewards and achievements."""
    repo = get_repo()
    s = stats(child["id"])
    repo.update("mk_children", child["id"], {"total_points": s["total_points"]})

    owned = {r["reward_id"] for r in repo.select("mk_child_rewards", child_id=child["id"])}
    new_rewards = []
    for r in sorted(repo.select("mk_rewards"), key=lambda r: r["threshold"]):
        if r["threshold"] <= s["total_points"] and r["id"] not in owned:
            repo.insert("mk_child_rewards", {"child_id": child["id"], "reward_id": r["id"]})
            new_rewards.append(public_reward(r))

    earned = {a["achievement_id"] for a in repo.select("mk_child_achievements", child_id=child["id"])}
    new_achievements = []
    for a in repo.select("mk_achievements"):
        rule = a["rule"]
        if a["id"] not in earned and s.get(rule["type"], 0) >= rule["count"]:
            repo.insert("mk_child_achievements", {"child_id": child["id"], "achievement_id": a["id"]})
            new_achievements.append(public_achievement(a))

    return {"total_points": s["total_points"], **xp(s["total_points"]),
            "new_rewards": new_rewards, "new_achievements": new_achievements}


def award(child, reason, ref=None, points=None):
    """Add points to the ledger (plus a daily-streak bonus on the first award of a day
    that follows an active day), then sync unlocks. Returns what to celebrate."""
    repo = get_repo()
    pts = config.POINTS[reason] if points is None else points
    breakdown = []
    if pts > 0:
        ledger = repo.select("mk_points_ledger", child_id=child["id"])
        days = {_day(e["created_at"]) for e in ledger}
        if _today() not in days and _today() - timedelta(days=1) in days:
            bonus = config.POINTS["daily_streak"]
            repo.insert("mk_points_ledger", {"child_id": child["id"], "reason": "daily_streak", "points": bonus,
                                             "ref": _today().isoformat()})
            breakdown.append({"reason": "daily_streak", "points": bonus})
        repo.insert("mk_points_ledger", {"child_id": child["id"], "reason": reason, "points": pts, "ref": ref})
        breakdown.append({"reason": reason, "points": pts})
    return {"points_awarded": sum(b["points"] for b in breakdown), "breakdown": breakdown, **_sync(child)}


def merge_awards(*awards):
    awards = [a for a in awards if a]
    if not awards:
        return None
    last = awards[-1]
    return {**last,
            "points_awarded": sum(a["points_awarded"] for a in awards),
            "breakdown": [b for a in awards for b in a["breakdown"]],
            "new_rewards": [r for a in awards for r in a["new_rewards"]],
            "new_achievements": [x for a in awards for x in a["new_achievements"]]}


# ───────────────────────── Lessons ─────────────────────────

def lessons_sorted():
    return sorted(get_repo().select("mk_lessons"), key=lambda l: l["position"])


def progress_by_lesson(child_id):
    return {p["lesson_id"]: p for p in get_repo().select("mk_child_progress", child_id=child_id)}


def unlocked_lesson_ids(child_id):
    """Lessons open in order: each one unlocks when the previous one is completed."""
    progress = progress_by_lesson(child_id)
    unlocked, open_next = set(), True
    for lesson in lessons_sorted():
        if open_next:
            unlocked.add(lesson["id"])
        open_next = progress.get(lesson["id"], {}).get("status") == "completed"
    return unlocked


def lesson_by_key(key):
    lesson = next((l for l in get_repo().select("mk_lessons", key=key)), None)
    require(lesson is not None, "Lesson not found", 404)
    return lesson


def require_unlocked(child, lesson):
    require(lesson["id"] in unlocked_lesson_ids(child["id"]), "Finish the previous lesson first", 403)


def lessons_overview(child):
    progress, unlocked = progress_by_lesson(child["id"]), unlocked_lesson_ids(child["id"])
    by_key = rs.regions_by_key()
    lesson_regions = {lk: [by_key[k] for k in keys] for lk, keys in rs.regions_by_lesson(child).items()}
    out = []
    for l in lessons_sorted():
        p = progress.get(l["id"], {})
        out.append({"key": l["key"], "position": l["position"], "title": l["title"], "emoji": l["emoji"],
                    "summary": l["summary"], "status": p.get("status", "new"), "unlocked": l["id"] in unlocked,
                    "video_watched": p.get("video_watched", False), "game": l["content"].get("game"),
                    "regions": [{k: r[k] for k in ("key", "short_name", "emoji")} for r in lesson_regions.get(l["key"], [])]})
    return out


def next_lesson(child):
    return next((l for l in lessons_overview(child) if l["unlocked"] and l["status"] != "completed"), None)


def _progress_row(child, lesson):
    repo = get_repo()
    row = next(iter(repo.select("mk_child_progress", child_id=child["id"], lesson_id=lesson["id"])), None)
    return row or repo.insert("mk_child_progress", {"child_id": child["id"], "lesson_id": lesson["id"], "status": "started",
                                                    "video_watched": False, "quiz_correct": 0, "quiz_total": 0})


def lesson_detail(child, key):
    lesson = lesson_by_key(key)
    require_unlocked(child, lesson)
    theme, style, rug = theme_for(child), child.get("learning_style") or "watch", rug_style_for(child)
    level = reading_level(child)
    content = lesson["content"]
    explain = list(content["explain"].get(str(level)) or content["explain"]["1"])
    if key in ("design", "create"):
        explain.append(f"You picked {rug['name']}, so try these shapes: {' '.join(rug['shapes'])}")
    progress = _progress_row(child, lesson)
    game = next((g for g in get_repo().select("mk_games") if g["key"] == content.get("game")), None)
    return {
        "key": lesson["key"], "position": lesson["position"], "title": lesson["title"], "emoji": lesson["emoji"],
        "summary": lesson["summary"], "reading_level": level, "learning_style": style,
        "sections": LEARNING_STYLES.get(style, LEARNING_STYLES["watch"])["order"],
        "explain": explain,
        "analogy": f"{theme['guide']['emoji']} {fill_vocab(content['analogy'], theme)}",
        "storyboard": [{"emoji": e, "caption": c} for e, c in content["storyboard"]],
        "cards": [{"emoji": e, "title": t, "text": x} for e, t, x in content["cards"]],
        "video_url": lesson.get("video_url"),
        "game": {"key": game["key"], "title": game["title"], "emoji": game["emoji"]} if game else None,
        "status": progress["status"], "video_watched": progress["video_watched"],
        "has_quiz": bool(get_repo().select("mk_questions", lesson_id=lesson["id"], kind="quiz")) or bool(rs.region_questions(child, key)),
        "regions": rs.lesson_regions(child, key),
    }


def public_question(q, rng=random):
    options = list(q["options"])
    rng.shuffle(options)
    return {"id": q["id"], "prompt": q["prompt"], "options": options}


def lesson_quiz(child, key):
    lesson = lesson_by_key(key)
    require_unlocked(child, lesson)
    level = reading_level(child)
    pool = [q for q in get_repo().select("mk_questions", lesson_id=lesson["id"], kind="quiz") if q["difficulty"] <= level]
    pool.sort(key=lambda q: q["difficulty"])
    picked = pool[:QUIZ_SIZE[level]] if len(pool) > QUIZ_SIZE[level] else pool
    # Each regional stop of this lesson adds its own question.
    return [public_question(q) for q in picked + rs.region_questions(child, key)]


def mark_video_watched(child, key):
    lesson = lesson_by_key(key)
    require_unlocked(child, lesson)
    row = _progress_row(child, lesson)
    if row["video_watched"]:
        return None
    get_repo().update("mk_child_progress", row["id"], {"video_watched": True})
    return award(child, "video_watched", ref=key)


def complete_lesson(child, key):
    lesson = lesson_by_key(key)
    require_unlocked(child, lesson)
    row = _progress_row(child, lesson)
    result = None
    if row["status"] != "completed":
        get_repo().update("mk_child_progress", row["id"], {"status": "completed", "completed_at": now_iso()})
        result = award(child, "lesson_completed", ref=key)
    return {"award": result, "next_lesson": next_lesson(child)}


def answer_question(child, question_id, choice):
    repo = get_repo()
    q = repo.get("mk_questions", question_id)
    require(q is not None, "Question not found", 404)
    if q["kind"] == "region":  # hosted by whichever lesson visits that region on this child's route
        lesson_key = rs.region_lesson(child, q.get("region_key"))
        require(lesson_key is not None, "Question not found", 404)
        lesson = lesson_by_key(lesson_key)
    else:
        lesson = repo.get("mk_lessons", q["lesson_id"])
    require_unlocked(child, lesson)  # no farming points on lessons the child hasn't reached
    choice = str(choice or "")[:200]
    previous = repo.select("mk_child_answers", child_id=child["id"], question_id=q["id"])
    correct = choice == q["answer"]
    repo.insert("mk_child_answers", {"child_id": child["id"], "question_id": q["id"], "choice": choice, "correct": correct})
    if q["kind"] in ("quiz", "region"):
        row = _progress_row(child, lesson)
        repo.update("mk_child_progress", row["id"], {"quiz_total": row["quiz_total"] + 1,
                                                     "quiz_correct": row["quiz_correct"] + int(correct)})
    result = award(child, "correct_answer", ref=q["id"]) if correct and not any(p["correct"] for p in previous) else None
    wrong_before = sum(1 for p in previous if not p["correct"])
    return {
        "correct": correct,
        "explanation": q["explanation"] if correct else None,
        "hint": None if correct else q["hint"],
        # After a second miss we show the answer so the child is never stuck.
        "correct_answer": q["answer"] if not correct and wrong_before >= 1 else None,
        "award": result,
    }


# ───────────────────────── Experience & summaries ─────────────────────────

def experience(child):
    s = stats(child["id"])
    theme = theme_for(child)
    return {
        "theme": theme,
        "rug_style": rug_style_for(child),
        "learning_style": {**LEARNING_STYLES.get(child.get("learning_style") or "watch"), "key": child.get("learning_style") or "watch"},
        "difficulty": {"level": difficulty(child), "label": DIFFICULTY_LABELS[difficulty(child)],
                       "reading_level": reading_level(child), "speed_seconds": speed_seconds(child)},
        "progress": s,
        "next_lesson": next_lesson(child),
        "regions": rs.journey(child),
        "available_themes": [{"key": k, "name": THEMES[k]["name"], "emoji": THEMES[k]["emoji"]}
                             for k in available_themes(child["id"])],
    }


def rewards_overview(child):
    repo = get_repo()
    s = stats(child["id"])
    owned = {r["reward_id"]: r["created_at"] for r in repo.select("mk_child_rewards", child_id=child["id"])}
    earned = {a["achievement_id"]: a["created_at"] for a in repo.select("mk_child_achievements", child_id=child["id"])}
    rewards = [{**public_reward(r), "unlocked": r["id"] in owned, "unlocked_at": owned.get(r["id"])}
               for r in sorted(repo.select("mk_rewards"), key=lambda r: r["threshold"])]
    return {
        "total_points": s["total_points"],
        "rewards": rewards,
        "next_reward": next((r for r in rewards if not r["unlocked"]), None),
        "achievements": [{**public_achievement(a), "earned": a["id"] in earned, "earned_at": earned.get(a["id"])}
                         for a in repo.select("mk_achievements")],
    }


def progress_summary(child):
    repo = get_repo()
    s = stats(child["id"])
    progress = progress_by_lesson(child["id"])
    games = {g["game_id"]: g for g in repo.select("mk_child_game_progress", child_id=child["id"])}
    ledger = sorted(repo.select("mk_points_ledger", child_id=child["id"]), key=lambda e: e["created_at"], reverse=True)
    lesson_ids = {l["key"]: l["id"] for l in lessons_sorted()}
    return {
        "stats": s,
        "quiz_accuracy": (s["answers_correct"] / s["answers_total"]) if s["answers_total"] else None,
        "lessons": [{**l, "quiz_correct": progress.get(lesson_ids[l["key"]], {}).get("quiz_correct", 0),
                     "quiz_total": progress.get(lesson_ids[l["key"]], {}).get("quiz_total", 0)}
                    for l in lessons_overview(child)],
        "games": [{"key": g["key"], "title": g["title"], "emoji": g["emoji"],
                   "plays": games.get(g["id"], {}).get("plays", 0),
                   "best_score": games.get(g["id"], {}).get("best_score", 0),
                   "max_score": games.get(g["id"], {}).get("max_score", 0),
                   "completed": games.get(g["id"], {}).get("completed", False)}
                  for g in repo.select("mk_games")],
        "regions": rs.journey(child),
        "recent_points": [{"reason": e["reason"], "points": e["points"], "created_at": e["created_at"]} for e in ledger[:12]],
    }
