"""Password hashing (scrypt via Werkzeug) and JWT issuing/verification."""
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from werkzeug.security import check_password_hash, generate_password_hash

import config

# Compared against when the email is unknown, so login timing doesn't reveal accounts.
_DUMMY_HASH = generate_password_hash("not-a-real-password-0")


def hash_password(password):
    return generate_password_hash(password, method="scrypt")


def verify_password(password_hash, password):
    return check_password_hash(password_hash or _DUMMY_HASH, password) and bool(password_hash)


def issue_token(parent_id):
    now = datetime.now(timezone.utc)
    exp = now + timedelta(hours=config.JWT_TTL_HOURS)
    claims = {"sub": parent_id, "role": "parent", "jti": uuid.uuid4().hex,
              "iat": now, "nbf": now, "exp": exp, "iss": config.JWT_ISSUER}
    return jwt.encode(claims, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM), exp


def issue_parent_unlock(parent_id, session_jti):
    """Short-lived proof that the parent re-entered their password during this login session."""
    now = datetime.now(timezone.utc)
    claims = {"sub": parent_id, "sid": session_jti, "role": "parent_unlock", "jti": uuid.uuid4().hex,
              "iat": now, "exp": now + timedelta(minutes=config.PARENT_UNLOCK_MINUTES), "iss": config.JWT_ISSUER}
    return jwt.encode(claims, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)


def check_parent_unlock(token, parent_id, session_jti):
    if not token:
        return False
    try:
        claims = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM], issuer=config.JWT_ISSUER,
                            options={"require": ["sub", "sid", "exp", "role"]})
    except jwt.InvalidTokenError:
        return False
    return claims["role"] == "parent_unlock" and claims["sub"] == parent_id and claims["sid"] == session_jti


def decode_token(token):
    """Raises jwt.InvalidTokenError on any problem (signature, expiry, issuer…)."""
    return jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM], issuer=config.JWT_ISSUER,
                      options={"require": ["sub", "exp", "jti", "iss", "role"]})


def public_parent(parent):
    """The only parent fields ever returned by the API (no hash, no consent internals)."""
    return {"id": parent["id"], "name": parent.get("full_name") or "", "email": parent["email"],
            "created_at": parent.get("created_at")}
