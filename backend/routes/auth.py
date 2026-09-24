from datetime import datetime, timezone

from flask import Blueprint, g, jsonify, make_response

import config
from middleware import get_repo
from middleware.auth import (authenticate_parent, clear_child_access, clear_parent_unlock, parent_route,
                             parent_unlocked, set_parent_unlock)
from middleware.rate_limit import by_ip, by_parent, rate_limit
from repository import now_iso
from services.auth_service import decode_token, hash_password, issue_token, public_parent, verify_password
from services.children_service import child_public
from validators import ApiError, clean_text, json_body, require, valid_email, valid_password

bp = Blueprint("auth", __name__, url_prefix="/api/auth")
CONSENT_VERSION = "2026-09-v2"


def _account_by_email(email):
    return next((p for p in get_repo().select("mk_parents", email=email) if p.get("password_hash")), None)


def _with_session(payload, parent, status=200):
    token, exp = issue_token(parent["id"])
    res = make_response(jsonify(payload), status)
    res.set_cookie(config.AUTH_COOKIE, token, httponly=True, secure=config.COOKIE_SECURE, samesite="Strict",
                   path="/api", max_age=config.JWT_TTL_HOURS * 3600)
    # The parent just typed their password: start in parent mode (and no child is inside yet).
    return clear_child_access(set_parent_unlock(res, parent["id"], decode_token(token)["jti"]))


def _mask_email(email):
    name, _, domain = (email or "").partition("@")
    return f"{name[:1]}***@{domain}" if domain else "***"


@bp.post("/register")
@rate_limit(("register", by_ip))
def register():
    d = json_body()
    name = clean_text(d.get("name"), 80)
    require(2 <= len(name) <= 80, "Please enter your name")
    email, password = valid_email(d.get("email")), valid_password(d.get("password"))
    require(d.get("consent") is True, "Parental consent is required to create an account")
    require(_account_by_email(email) is None, "An account with this email already exists. Please log in.", 409)
    parent = get_repo().insert("mk_parents", {
        "email": email, "full_name": name, "password_hash": hash_password(password),
        "consent_given": True, "consent_at": now_iso(), "consent_version": CONSENT_VERSION,
    })
    return _with_session({"parent": public_parent(parent), "children": []}, parent, 201)


@bp.post("/login")
@rate_limit(("login", by_ip))
def login():
    d = json_body()
    email = clean_text(d.get("email"), 254).lower()
    password = str(d.get("password") or "")[:128]
    parent = _account_by_email(email)
    # Same message whether the email or the password is wrong.
    if not verify_password(parent["password_hash"] if parent else None, password):
        raise ApiError("Email or password is incorrect", 401)
    children = get_repo().select("mk_children", parent_id=parent["id"])
    return _with_session({"parent": public_parent(parent), "children": [child_public(c) for c in children]}, parent)


@bp.get("/me")
@parent_route
def me():
    children = sorted(get_repo().select("mk_children", parent_id=g.parent["id"]), key=lambda c: c["created_at"])
    unlocked = parent_unlocked()
    parent = public_parent(g.parent)
    if not unlocked:
        parent["email"] = _mask_email(parent["email"])  # no parent details in child mode
    return jsonify(parent=parent, children=[child_public(c) for c in children], parent_unlocked=unlocked)


@bp.get("/parent-mode")
@parent_route
def parent_mode():
    return jsonify(unlocked=parent_unlocked(), minutes=config.PARENT_UNLOCK_MINUTES)


@bp.post("/parent-mode/unlock")
@parent_route
@rate_limit(("unlock", by_ip), ("unlock", by_parent))
def parent_unlock():
    """Step-up auth: re-enter the account password to open parent-only content."""
    password = str(json_body().get("password") or "")[:128]
    if not verify_password(g.parent.get("password_hash"), password):
        raise ApiError("That password isn't right", 401, code="wrong_password")
    return set_parent_unlock(make_response(jsonify(unlocked=True, minutes=config.PARENT_UNLOCK_MINUTES)),
                             g.parent["id"], g.claims["jti"])


@bp.post("/parent-mode/lock")
@authenticate_parent
def parent_lock():
    """Back to child mode (called when a child's play area opens)."""
    return clear_parent_unlock(make_response(jsonify(unlocked=False)))


@bp.post("/logout")
@authenticate_parent
def logout():
    exp = datetime.fromtimestamp(g.claims["exp"], tz=timezone.utc).isoformat()
    get_repo().insert("mk_revoked_tokens", {"jti": g.claims["jti"], "expires_at": exp})
    res = make_response(jsonify(ok=True))
    res.delete_cookie(config.AUTH_COOKIE, path="/api", samesite="Strict", secure=config.COOKIE_SECURE, httponly=True)
    return clear_child_access(clear_parent_unlock(res))
