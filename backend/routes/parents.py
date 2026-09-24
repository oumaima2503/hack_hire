from flask import Blueprint, g, jsonify

from middleware import get_repo
from middleware.auth import parent_child_route, parent_only_route
from middleware.rate_limit import by_ip, by_parent, rate_limit
from services import pattern_service
from services.auth_service import verify_password
from validators import ApiError
from services import children_service as cs
from services.auth_service import public_parent
from validators import json_body, require

bp = Blueprint("parents", __name__, url_prefix="/api/parents")


@bp.get("/dashboard")
@parent_only_route
def dashboard():
    return jsonify(parent=public_parent(g.parent), children=cs.parent_dashboard(g.parent))


@bp.get("/children")
@parent_only_route
def list_children():
    children = sorted(get_repo().select("mk_children", parent_id=g.parent["id"]), key=lambda c: c["created_at"])
    return jsonify([cs.child_public(c) for c in children])


@bp.post("/children")
@parent_only_route
def add_child():
    # parent_id comes from the verified token, never from the body.
    return jsonify(cs.create_child(g.parent["id"], json_body())), 201


@bp.get("/children/<child_id>")
@parent_child_route
def get_child(child_id):
    return jsonify(cs.child_detail_for_parent(g.child))


@bp.put("/children/<child_id>")
@parent_child_route
def update_child(child_id):
    patch = cs.validate_child_fields(json_body(), child_id=g.child["id"])
    require(patch, "Nothing to update")
    return jsonify(cs.child_public(get_repo().update("mk_children", g.child["id"], patch)))


@bp.delete("/children/<child_id>")
@parent_child_route
def delete_child(child_id):
    cs.delete_child(g.child["id"])
    return "", 204


@bp.post("/children/<child_id>/pattern/reveal")
@parent_child_route
@rate_limit(("unlock", by_ip), ("unlock", by_parent))
def reveal_pattern(child_id):
    """Pattern recovery: parent mode AND the password typed again, for this one request."""
    password = str(json_body().get("password") or "")[:128]
    if not verify_password(g.parent.get("password_hash"), password):
        raise ApiError("That password isn't right", 401, code="wrong_password")
    return jsonify(pattern=pattern_service.reveal(g.child))
