"""Request guards, applied in this order on private routes:

    @authenticate_parent      → valid, non-revoked JWT; loads g.parent
    @authorize_parent         → role 'parent' + consent on record
    @verify_child_ownership   → g.child, only if child.parent_id == g.parent.id

    @require_child_access     → child data: this child's secret pattern was entered in this
                                session (child pass), or the parent is in parent mode.
                                Child A's pass never opens child B's data.
    @require_parent_unlock    → parent-only content: the password was re-entered recently
                                (parent mode). Children playing on the same login can't
                                open it, even by typing URLs or calling the API.

The parent id always comes from the verified token, never from the request body.
"""
from functools import wraps

import jwt
from flask import g, make_response, request

import config
from middleware import get_repo
from services.auth_service import (check_child_access, check_parent_unlock, decode_token, issue_child_access,
                                   issue_parent_unlock)
from validators import ApiError, is_uuid

MUTATING = {"POST", "PUT", "PATCH", "DELETE"}


def token_from_request():
    header = request.headers.get("Authorization", "")
    if header.startswith("Bearer "):
        return header[7:].strip(), "header"
    return request.cookies.get(config.AUTH_COOKIE), "cookie"


def csrf_guard():
    """before_request hook. A cookie is sent by the browser automatically, so for
    cookie-authenticated writes we also require a custom header, which a cross-site
    form cannot set (and a cross-site fetch would need a CORS preflight we refuse)."""
    if request.method in MUTATING and request.cookies.get(config.AUTH_COOKIE) \
            and not request.headers.get("Authorization") \
            and request.headers.get("X-Requested-With") != "fetch":
        raise ApiError("Missing X-Requested-With header", 403)


def optional_parent():
    """The logged-in parent if the request carries a valid session, else None (never raises)."""
    token, _ = token_from_request()
    if not token:
        return None
    try:
        claims = decode_token(token)
    except jwt.InvalidTokenError:
        return None
    repo = get_repo()
    if repo.select("mk_revoked_tokens", jti=claims["jti"]) or not is_uuid(claims["sub"]):
        return None
    return repo.get("mk_parents", claims["sub"])


def authenticate_parent(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token, _ = token_from_request()
        if not token:
            raise ApiError("Please log in", 401)
        try:
            claims = decode_token(token)
        except jwt.InvalidTokenError:
            raise ApiError("Your session has expired, please log in again", 401)
        repo = get_repo()
        if repo.select("mk_revoked_tokens", jti=claims["jti"]):
            raise ApiError("Your session has ended, please log in again", 401)
        parent = repo.get("mk_parents", claims["sub"]) if is_uuid(claims["sub"]) else None
        if not parent or not parent.get("password_hash"):
            raise ApiError("Please log in", 401)
        g.parent, g.claims = parent, claims
        return fn(*args, **kwargs)
    return wrapper


def authorize_parent(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if g.claims.get("role") != "parent" or not g.parent.get("consent_given"):
            raise ApiError("Not allowed", 403)
        return fn(*args, **kwargs)
    return wrapper


def _requested_child_id(kwargs):
    if kwargs.get("child_id"):
        return kwargs["child_id"]
    if request.args.get("childId"):
        return request.args["childId"]
    body = request.get_json(silent=True) or {}
    return body.get("childId") or body.get("child_id")


def verify_child_ownership(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        child_id = _requested_child_id(kwargs)
        child = get_repo().get("mk_children", child_id) if is_uuid(child_id) else None
        # 404 (not 403) so another family's child ids can't even be confirmed to exist.
        if not child or child["parent_id"] != g.parent["id"]:
            raise ApiError("Child not found", 404)
        g.child = child
        return fn(*args, **kwargs)
    return wrapper


def parent_unlocked():
    """True when this login session is in parent mode (password re-entered recently)."""
    return check_parent_unlock(request.cookies.get(config.PARENT_COOKIE), g.parent["id"], g.claims["jti"])


def parent_locked_error():
    return ApiError("Grown-ups only: please enter your password to continue", 403, code="parent_locked")


def set_parent_unlock(res, parent_id, session_jti):
    res.set_cookie(config.PARENT_COOKIE, issue_parent_unlock(parent_id, session_jti), httponly=True,
                   secure=config.COOKIE_SECURE, samesite="Strict", path="/api",
                   max_age=config.PARENT_UNLOCK_MINUTES * 60)
    return res


def clear_parent_unlock(res):
    res.delete_cookie(config.PARENT_COOKIE, path="/api", samesite="Strict", secure=config.COOKIE_SECURE, httponly=True)
    return res


def require_parent_unlock(fn):
    """Parent mode guard. Each parent request slides the idle timeout forward."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not parent_unlocked():
            raise parent_locked_error()
        return set_parent_unlock(make_response(fn(*args, **kwargs)), g.parent["id"], g.claims["jti"])
    return wrapper


def parent_route(fn):
    """authenticate_parent + authorize_parent."""
    return authenticate_parent(authorize_parent(fn))


def child_access_ok():
    """True when the request carries this child's pass (secret pattern entered in this login session)."""
    return check_child_access(request.cookies.get(config.CHILD_COOKIE), g.parent["id"], g.child["id"], g.claims["jti"])


def set_child_access(res, parent_id, child_id, session_jti):
    res.set_cookie(config.CHILD_COOKIE, issue_child_access(parent_id, child_id, session_jti), httponly=True,
                   secure=config.COOKIE_SECURE, samesite="Strict", path="/api", max_age=config.JWT_TTL_HOURS * 3600)
    return res


def clear_child_access(res):
    res.delete_cookie(config.CHILD_COOKIE, path="/api", samesite="Strict", secure=config.COOKIE_SECURE, httponly=True)
    return res


def require_child_access(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not (child_access_ok() or parent_unlocked()):
            raise ApiError("Enter your secret pattern to open your world", 403, code="child_locked")
        return fn(*args, **kwargs)
    return wrapper


def child_owner_route(fn):
    """authenticate_parent + authorize_parent + verify_child_ownership (no child pass needed:
    used to ENTER a child's world with the secret pattern)."""
    return authenticate_parent(authorize_parent(verify_child_ownership(fn)))


def child_route(fn):
    """Child data: ownership + (this child's pass or parent mode)."""
    return authenticate_parent(authorize_parent(verify_child_ownership(require_child_access(fn))))


def parent_only_route(fn):
    """parent_route + parent mode (password re-entered)."""
    return authenticate_parent(authorize_parent(require_parent_unlock(fn)))


def parent_child_route(fn):
    """child_route + parent mode: a parent action on one of their children."""
    return authenticate_parent(authorize_parent(verify_child_ownership(require_parent_unlock(fn))))
