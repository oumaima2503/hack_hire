from flask import Blueprint, g, jsonify, request

from middleware.auth import child_route
from middleware.rate_limit import by_child, by_ip, rate_limit
from services import chat_service
from validators import json_body

bp = Blueprint("chat", __name__, url_prefix="/api/chat")


def _key(value):
    value = (value or "").strip()
    return value[:40] or None


@bp.post("")
@child_route  # childId from the body is verified against the logged-in parent
@rate_limit(("chat_ip", by_ip), ("chat_minute", by_child), ("chat_day", by_child))
def chat():
    d = json_body()
    return jsonify(chat_service.reply(g.child, d.get("message"), lesson_key=_key(d.get("lessonId")),
                                      game_key=_key(d.get("gameKey")), question_id=_key(d.get("questionId")),
                                      game_state=d.get("gameState"),
                                      page=d.get("page") if d.get("page") in chat_service.PAGES else None,
                                      voice=d.get("voice") is True))


@bp.get("/history")
@child_route
def history():
    return jsonify(chat_service.history(g.child, _key(request.args.get("lessonId"))))
