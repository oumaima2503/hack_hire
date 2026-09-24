"""Each child's secret picture pattern (e.g. 🐱 → ⭐ → 🚀 → 🦖).

It lets a child open ONLY their own learning world without the parent's password.
The pattern is never stored or returned: only a salted scrypt hash, bound to the
child's id. Wrong attempts are counted in the database and lead to a short lock."""
from datetime import datetime, timedelta, timezone

from werkzeug.security import check_password_hash, generate_password_hash

import config
from middleware import get_repo
from repository import now_iso
from validators import ApiError

# Picture keys (the frontend maps them to emojis). Changing this list invalidates existing patterns.
PATTERN_ICONS = ("cat", "lion", "dino", "panda", "camel", "star", "moon", "rocket",
                 "rainbow", "apple", "orange", "car", "balloon", "unicorn", "teapot", "lantern")
PATTERN_LENGTH = 4


def _valid(pattern):
    return (isinstance(pattern, list) and len(pattern) == PATTERN_LENGTH
            and all(isinstance(k, str) and k in PATTERN_ICONS for k in pattern))


def _secret(child_id, pattern):
    return f"{child_id}:{'-'.join(pattern)}"


def _now():
    return datetime.now(timezone.utc)


def set_pattern(child, pattern):
    if not _valid(pattern):
        raise ApiError(f"Choose {PATTERN_LENGTH} pictures for your secret pattern", 400, code="invalid_pattern")
    if len(set(pattern)) < 2:
        raise ApiError("Use at least 2 different pictures", 400, code="invalid_pattern")
    get_repo().update("mk_children", child["id"], {
        "pattern_hash": generate_password_hash(_secret(child["id"], pattern), method="scrypt"),
        "pattern_set_at": now_iso(), "pattern_fails": 0, "pattern_locked_until": None,
    })


def clear_pattern(child):
    """Parent reset: the child creates a new pattern next time (with a grown-up)."""
    get_repo().update("mk_children", child["id"], {"pattern_hash": None, "pattern_set_at": None,
                                                   "pattern_fails": 0, "pattern_locked_until": None})


def verify(child, pattern):
    """Raises ApiError unless `pattern` is this child's pattern. Never says which part was wrong."""
    if not child.get("pattern_hash"):
        raise ApiError("Ask a grown-up to help you make your secret pattern first", 409, code="no_pattern")
    locked = child.get("pattern_locked_until")
    if locked and datetime.fromisoformat(str(locked).replace("Z", "+00:00")) > _now():
        wait = int((datetime.fromisoformat(str(locked).replace("Z", "+00:00")) - _now()).total_seconds()) + 1
        raise ApiError(f"Let's take a little break! Try again in {wait} seconds.", 429, code="pattern_locked")
    if _valid(pattern) and check_password_hash(child["pattern_hash"], _secret(child["id"], pattern)):
        if child.get("pattern_fails"):
            get_repo().update("mk_children", child["id"], {"pattern_fails": 0, "pattern_locked_until": None})
        return
    fails = int(child.get("pattern_fails") or 0) + 1
    patch = {"pattern_fails": fails}
    if fails >= config.PATTERN_MAX_FAILS:
        patch = {"pattern_fails": 0,
                 "pattern_locked_until": (_now() + timedelta(seconds=config.PATTERN_LOCK_SECONDS)).isoformat()}
    get_repo().update("mk_children", child["id"], patch)
    raise ApiError("Oops! Try your secret pattern again!", 401, code="wrong_pattern")
