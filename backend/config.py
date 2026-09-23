"""Runtime configuration. Every secret comes from the environment (backend/.env),
never from source code. Import after load_dotenv()."""
import json
import logging
import os
import secrets

log = logging.getLogger(__name__)


def _bool(name, default=False):
    return os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes")


def _int(name, default):
    try:
        return int(os.getenv(name, default))
    except ValueError:
        return default


PRODUCTION = os.getenv("APP_ENV", "development").lower() == "production"

# ── Auth ──
JWT_SECRET = os.getenv("JWT_SECRET", "")
if not JWT_SECRET:
    if PRODUCTION:
        raise RuntimeError("JWT_SECRET must be set in production")
    JWT_SECRET = secrets.token_urlsafe(48)
    log.warning("JWT_SECRET not set: using a random dev secret (sessions reset on restart)")
if len(JWT_SECRET) < 32:
    raise RuntimeError("JWT_SECRET must be at least 32 characters")
JWT_ALGORITHM = "HS256"
JWT_ISSUER = "myrugy-kids"
JWT_TTL_HOURS = _int("JWT_TTL_HOURS", 12)
AUTH_COOKIE = "mr_session"
# Parent mode: parent-only content needs the account password again (step-up auth).
# The unlock lives in its own httpOnly cookie, is bound to the login session and
# expires after this many minutes without parent activity.
PARENT_COOKIE = "mr_parent"
PARENT_UNLOCK_MINUTES = _int("PARENT_UNLOCK_MINUTES", 10)
COOKIE_SECURE = _bool("COOKIE_SECURE", PRODUCTION)

# ── Points (configurable: POINTS_CONFIG='{"lesson_completed": 15}') ──
POINTS = {
    "lesson_completed": 10,
    "video_watched": 5,
    "game_completed": 20,
    "correct_answer": 5,
    "challenge_completed": 30,
    "rug_created": 25,
    "daily_streak": 15,
}
try:
    POINTS.update({k: int(v) for k, v in json.loads(os.getenv("POINTS_CONFIG") or "{}").items() if k in POINTS})
except (ValueError, TypeError, AttributeError):
    log.warning("Ignoring invalid POINTS_CONFIG")
POINTS_PER_LEVEL = max(1, _int("POINTS_PER_LEVEL", 100))
RUG_POINTS_DAILY_CAP = _int("RUG_POINTS_DAILY_CAP", 2)

# ── Gemini (backend only) ──
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_TIMEOUT = _int("GEMINI_TIMEOUT", 20)

# ── Rate limits: (requests, window seconds) ──
LIMITS = {
    "login": (10, 15 * 60),
    "unlock": (5, 15 * 60),
    "register": (5, 60 * 60),
    "chat_minute": (8, 60),
    "chat_day": (80, 24 * 60 * 60),
    "chat_ip": (30, 60),
}
