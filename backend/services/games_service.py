"""Game configuration (personalised per child) and server-side scoring.

Every config is built from the child's stored profile: theme (characters,
wording, rewards), difficulty (rounds, pairs, steps, pattern length), speed
(timer), favourite colour and rug style (palette and shapes)."""
import random

import config
from middleware import get_repo
from repository import now_iso
from services import learning_service as ls, regions_service as rs
from validators import clean_text, require

ROUNDS = {1: 3, 2: 4, 3: 5}
PAIRS = {1: 3, 2: 4, 3: 6}
CHALLENGE_SIZE = {1: 5, 2: 6, 3: 8}
PATTERN_LENGTH = {1: 4, 2: 6, 3: 8}
GRID = {1: (8, 10), 2: (10, 12), 3: (12, 14)}
BASIC_STAMPS = [{"key": "dot", "name": "Dot", "emoji": "▪️", "mask": [[1]]},
                {"key": "stripe", "name": "Stripe", "emoji": "➖", "mask": [[1, 1, 1, 1]]}]
TEXTURES = ["wool", "cotton", "silk"]


def game_by_key(key):
    game = next(iter(get_repo().select("mk_games", key=key)), None)
    require(game is not None, "Game not found", 404)
    return game


def process_steps(game, d):
    """The correct rug-making order for difficulty d (server-side only)."""
    return game["config"]["steps"][str(d)]


def _require_game_unlocked(child, game):
    require(game["lesson_id"] in ls.unlocked_lesson_ids(child["id"]), "Finish the lessons before this game first", 403)


def games_overview(child):
    repo = get_repo()
    unlocked = ls.unlocked_lesson_ids(child["id"])
    progress = {g["game_id"]: g for g in repo.select("mk_child_game_progress", child_id=child["id"])}
    lessons = {l["id"]: l for l in repo.select("mk_lessons")}
    out = []
    for g in sorted(repo.select("mk_games"), key=lambda g: lessons[g["lesson_id"]]["position"]):
        p = progress.get(g["id"], {})
        lesson = lessons[g["lesson_id"]]
        out.append({"key": g["key"], "type": g["type"], "title": g["title"], "emoji": g["emoji"],
                    "lesson": {"key": lesson["key"], "title": lesson["title"]},
                    "unlocked": g["lesson_id"] in unlocked, "completed": p.get("completed", False),
                    "plays": p.get("plays", 0), "best_score": p.get("best_score", 0), "max_score": p.get("max_score", 0)})
    return out


# ───────────────────────── Studio options ─────────────────────────

def studio_options(child):
    rewards = ls.unlocked_rewards(child["id"])
    by_kind = lambda kind: [r for r in rewards if r["kind"] == kind]  # noqa: E731
    theme = ls.theme_for(child)
    workshop = bool(by_kind("workshop"))
    visited = rs.visited_regions(child)
    rows, cols = by_kind("workshop")[0]["payload"]["grid"] if workshop else GRID[ls.difficulty(child)]
    return {
        "rows": rows, "cols": cols, "workshop": workshop,
        # Unlocked colours, plus the signature colours and emblems of every region visited so far.
        "palette": ls.child_palette(child, [r["payload"]["hex"] for r in by_kind("color")] + [c for reg in visited for c in reg["palette"]]),
        "motifs": list(dict.fromkeys(theme["motifs"] + [r["payload"]["motif"] for r in by_kind("character")] + [reg["emoji"] for reg in visited])),
        "stamps": BASIC_STAMPS + [{"key": r["key"], "name": r["name"], "emoji": r["emoji"], "mask": r["payload"]["stamp"]}
                                  for r in by_kind("pattern")],
        "templates": [r["payload"]["template"] for r in by_kind("design")],
        "textures": TEXTURES,
        "shapes": ls.rug_style_for(child)["shapes"],
    }


# ───────────────────────── Pattern generation ─────────────────────────

def _pattern_params(child):
    d = ls.difficulty(child)
    units = {1: 2, 2: 3, 3: 4}[d]
    return d, ls.child_palette(child)[:units + 1], ls.rug_style_for(child)["shapes"], units


def generate_pattern(child, seed):
    """Deterministic from the seed, so the server can re-check the child's answer."""
    d, palette, shapes, units = _pattern_params(child)
    rng = random.Random(seed)
    colors = rng.sample(palette, units)
    unit_cells = [{"color": c, "shape": rng.choice(shapes)} for c in colors]
    length = PATTERN_LENGTH[d]
    if d == 3:  # mirror symmetry: ABCD DCBA
        half = [unit_cells[i % units] for i in range(length // 2)]
        rng.shuffle(half)
        return half + half[::-1]
    return [unit_cells[i % units] for i in range(length)]  # repeating: ABAB / ABCABC


# ───────────────────────── Config ─────────────────────────

def game_config(child, key):
    repo = get_repo()
    game = game_by_key(key)
    _require_game_unlocked(child, game)
    theme, d = ls.theme_for(child), ls.difficulty(child)
    v = theme["vocab"]
    base = {"key": game["key"], "type": game["type"], "title": game["title"], "emoji": game["emoji"],
            "difficulty": d, "speed_seconds": ls.speed_seconds(child), "guide": theme["guide"],
            "reward_emoji": v["point_emoji"], "motifs": theme["motifs"],
            # Lets the MyRugy Guide introduce a game the first time it is opened.
            "plays": next((p["plays"] for p in repo.select("mk_child_game_progress", child_id=child["id"], game_id=game["id"])), 0)}

    if game["type"] == "choose_material":
        pool = [q for q in repo.select("mk_questions", kind="material") if q["difficulty"] <= d]
        rounds = random.sample(pool, min(ROUNDS[d], len(pool)))
        return {**base, "intro": f"The {v['friend']} needs a rug for the {v['place']}! Which material should we use?",
                "questions": [ls.public_question(q) for q in rounds]}

    if game["type"] == "match_tools":
        pairs = sorted((p for p in game["config"]["pairs"] if p["difficulty"] <= d), key=lambda p: p["difficulty"])[:PAIRS[d]]
        purposes = [p["purpose"] for p in pairs]
        random.shuffle(purposes)
        tools = [{"tool": p["tool"], "emoji": p["emoji"]} for p in pairs]
        random.shuffle(tools)
        return {**base, "intro": f"Help the {v['friend']} pack the weaving tools: match each tool to its job!",
                "tools": tools, "purposes": purposes,
                "pairs": {p["tool"]: p["purpose"] for p in pairs}}  # instant feedback; completion re-checked server-side

    if game["type"] == "build_pattern":
        seed = random.randint(1, 2**31 - 1)
        _, palette, shapes, _ = _pattern_params(child)
        return {**base, "intro": ("Copy the mirror pattern: the right side matches the left!" if d == 3
                                  else "Copy the repeating pattern onto your rug row!"),
                "seed": seed, "palette": palette, "shapes": shapes, "target": generate_pattern(child, seed)}

    if game["type"] == "order_steps":
        steps = [{"id": s[0], "emoji": s[1], "label": s[2]} for s in game["config"]["steps"][str(d)]]
        shuffled = steps[:]
        while shuffled == steps:
            random.shuffle(shuffled)
        return {**base, "intro": f"The {v['friend']} mixed up the weaving steps! Put them in the right order.",
                "steps": shuffled}

    if game["type"] == "create_rug":
        return {**base, "intro": f"Design a rug for the {v['place']}!", "studio": studio_options(child)}

    # challenge: questions from every lesson the child has opened
    unlocked = ls.unlocked_lesson_ids(child["id"])
    level = ls.reading_level(child)
    regions = rs.unlocked_region_keys(child)
    pool = [q for q in repo.select("mk_questions", kind="quiz") if q["lesson_id"] in unlocked and q["difficulty"] <= level]
    pool += [q for q in repo.select("mk_questions", kind="region") if q.get("region_key") in regions]
    picked = random.sample(pool, min(CHALLENGE_SIZE[d], len(pool)))
    return {**base, "intro": f"{v['cheer']}! Answer questions from every lesson to win the trophy.",
            "questions": [ls.public_question(q) for q in picked], "pass_ratio": game["config"].get("pass_ratio", 0.6)}


# ───────────────────────── Completion (server-side check) ─────────────────────────

def _score_answers(answers, kinds):
    require(isinstance(answers, dict) and 1 <= len(answers) <= 12, "Answers required")
    repo, score = get_repo(), 0
    for qid, choice in answers.items():
        q = repo.get("mk_questions", qid) if len(str(qid)) == 36 else None
        require(q is not None and q["kind"] in kinds, "Unknown question")
        score += int(str(choice) == q["answer"])
    return score, len(answers)


def complete_game(child, key, payload):
    repo = get_repo()
    game = game_by_key(key)
    _require_game_unlocked(child, game)
    d = ls.difficulty(child)
    extra = {}

    if game["type"] == "choose_material":
        score, max_score = _score_answers(payload.get("answers"), ("material",))
        passed = score * 2 >= max_score
    elif game["type"] == "challenge":
        score, max_score = _score_answers(payload.get("answers"), ("quiz", "region"))
        passed = max_score >= 3 and score >= max_score * game["config"].get("pass_ratio", 0.6)
    elif game["type"] == "match_tools":
        pairs = {p["tool"]: p["purpose"] for p in game["config"]["pairs"]}
        submitted = payload.get("pairs")
        require(isinstance(submitted, dict) and submitted, "Pairs required")
        score = sum(1 for t, purpose in submitted.items() if pairs.get(t) == purpose)
        max_score = len(submitted)
        passed = max_score >= min(PAIRS[d], len(pairs)) and score == max_score
    elif game["type"] == "build_pattern":
        seed, cells = payload.get("seed"), payload.get("cells")
        require(isinstance(seed, int) and isinstance(cells, list), "Pattern required")
        target = generate_pattern(child, seed)
        positions = [i < len(cells) and isinstance(cells[i], dict) and cells[i].get("color") == t["color"]
                     and cells[i].get("shape") == t["shape"] for i, t in enumerate(target)]
        score, max_score, passed = sum(positions), len(target), all(positions)
        extra["correct_positions"] = positions
    elif game["type"] == "order_steps":
        correct = [s[0] for s in game["config"]["steps"][str(d)]]
        order = payload.get("order")
        require(isinstance(order, list) and sorted(map(str, order)) == sorted(correct), "Order all the steps")
        positions = [a == b for a, b in zip(order, correct)]
        score, max_score, passed = sum(positions), len(correct), all(positions)
        extra["correct_positions"] = positions
    else:
        require(False, "Save your rug in the studio to finish this game")

    return {"passed": passed, "score": score, "max_score": max_score, **extra,
            "award": record_game_result(child, game, score, max_score, passed)}


def record_game_result(child, game, score, max_score, passed):
    repo = get_repo()
    row = next(iter(repo.select("mk_child_game_progress", child_id=child["id"], game_id=game["id"])), None)
    first_pass = passed and not (row and row["completed"])
    patch = {"plays": (row["plays"] if row else 0) + 1,
             "best_score": max(score, row["best_score"] if row else 0),
             "max_score": max(max_score, row["max_score"] if row else 0),
             "completed": bool(passed or (row and row["completed"]))}
    if first_pass:
        patch["completed_at"] = now_iso()
    if row:
        repo.update("mk_child_game_progress", row["id"], patch)
    else:
        repo.insert("mk_child_game_progress", {"child_id": child["id"], "game_id": game["id"], **patch})
    if not first_pass:
        return None
    awards = [ls.award(child, "game_completed", ref=game["key"])]
    if game["type"] == "challenge":
        awards.append(ls.award(child, "challenge_completed", ref=game["key"]))
    return ls.merge_awards(*awards)


# ───────────────────────── Rugs ─────────────────────────

HEX = set("0123456789abcdef")


def _valid_hex(c):
    return isinstance(c, str) and len(c) == 7 and c[0] == "#" and set(c[1:].lower()) <= HEX


def create_rug(child, payload):
    repo = get_repo()
    game = game_by_key("create_rug")
    _require_game_unlocked(child, game)
    opts = studio_options(child)
    name = clean_text(payload.get("name"), 40) or "My rug"
    design = payload.get("design") or {}
    rows, cols, cells = design.get("rows"), design.get("cols"), design.get("cells")
    require(isinstance(rows, int) and isinstance(cols, int) and 4 <= rows <= opts["rows"] and 4 <= cols <= opts["cols"],
            "Invalid rug size")
    require(isinstance(cells, list) and len(cells) == rows * cols, "Invalid rug cells")
    allowed = set(opts["palette"])
    require(all(c is None or (_valid_hex(c) and c.lower() in allowed) for c in cells), "Use colours from your palette")
    require(any(cells), "Colour at least one square")
    motifs = design.get("motifs") or []
    require(isinstance(motifs, list) and len(motifs) <= 80, "Too many motifs")
    require(all(isinstance(m, dict) and isinstance(m.get("i"), int) and 0 <= m["i"] < rows * cols
                and m.get("e") in opts["motifs"] for m in motifs), "Invalid motif")
    texture = design.get("texture") if design.get("texture") in TEXTURES else "wool"

    rug = repo.insert("mk_created_rugs", {
        "child_id": child["id"], "name": name,
        "design": {"rows": rows, "cols": cols, "cells": [c.lower() if c else None for c in cells],
                   "motifs": [{"i": m["i"], "e": m["e"]} for m in motifs], "texture": texture},
    })
    today = ls._today()
    rewarded_today = sum(1 for e in repo.select("mk_points_ledger", child_id=child["id"], reason="rug_created")
                         if ls._day(e["created_at"]) == today)
    rug_award = ls.award(child, "rug_created", ref=rug["id"],
                         points=None if rewarded_today < config.RUG_POINTS_DAILY_CAP else 0)
    game_award = record_game_result(child, game, 1, 1, True)
    return {"rug": public_rug(rug), "award": ls.merge_awards(rug_award, game_award)}


def public_rug(r):
    return {"id": r["id"], "name": r["name"], "design": r["design"], "created_at": r["created_at"]}


def list_rugs(child_id):
    rugs = sorted(get_repo().select("mk_created_rugs", child_id=child_id), key=lambda r: r["created_at"], reverse=True)
    return [public_rug(r) for r in rugs]
