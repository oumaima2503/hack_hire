"""Child-scoped routes. Every route runs authenticate → authorize → verify_child_ownership,
so g.child is always a child of the logged-in parent."""
from flask import Blueprint, g, jsonify

from middleware import get_repo
from middleware.auth import child_route
from services import children_service as cs, games_service as games, learning_service as ls
from validators import json_body, require

bp = Blueprint("learning", __name__, url_prefix="/api/children/<child_id>")


# ── Profile (used by onboarding steps) ──
@bp.get("")
@child_route
def get_child(child_id):
    return jsonify(cs.child_public(g.child))


@bp.patch("")
@child_route
def patch_child(child_id):
    patch = cs.validate_child_fields(json_body(), child_id=g.child["id"])
    require(patch, "Nothing to update")
    return jsonify(cs.child_public(get_repo().update("mk_children", g.child["id"], patch)))


@bp.get("/experience")
@child_route
def experience(child_id):
    return jsonify(child=cs.child_public(g.child), **ls.experience(g.child))


# ── Lessons ──
@bp.get("/lessons")
@child_route
def lessons(child_id):
    return jsonify(ls.lessons_overview(g.child))


@bp.get("/lessons/<key>")
@child_route
def lesson(child_id, key):
    return jsonify(ls.lesson_detail(g.child, key))


@bp.get("/lessons/<key>/quiz")
@child_route
def lesson_quiz(child_id, key):
    return jsonify(ls.lesson_quiz(g.child, key))


@bp.post("/lessons/<key>/video-watched")
@child_route
def video_watched(child_id, key):
    return jsonify(award=ls.mark_video_watched(g.child, key))


@bp.post("/lessons/<key>/complete")
@child_route
def complete_lesson(child_id, key):
    return jsonify(ls.complete_lesson(g.child, key))


@bp.post("/questions/<question_id>/answer")
@child_route
def answer(child_id, question_id):
    require(len(question_id) == 36, "Question not found", 404)
    return jsonify(ls.answer_question(g.child, question_id, json_body().get("choice")))


# ── Games ──
@bp.get("/games")
@child_route
def game_list(child_id):
    return jsonify(games.games_overview(g.child))


@bp.get("/games/<key>")
@child_route
def game(child_id, key):
    return jsonify(games.game_config(g.child, key))


@bp.post("/games/<key>/complete")
@child_route
def complete_game(child_id, key):
    return jsonify(games.complete_game(g.child, key, json_body()))


# ── Rug studio ──
@bp.get("/rugs")
@child_route
def rugs(child_id):
    return jsonify(games.list_rugs(g.child["id"]))


@bp.post("/rugs")
@child_route
def create_rug(child_id):
    return jsonify(games.create_rug(g.child, json_body())), 201


# ── Rewards & progress ──
@bp.get("/rewards")
@child_route
def rewards(child_id):
    return jsonify(ls.rewards_overview(g.child))


@bp.get("/progress")
@child_route
def progress(child_id):
    return jsonify(ls.progress_summary(g.child))
