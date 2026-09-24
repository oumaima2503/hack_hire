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
# Child pass: set after the child's secret picture pattern; opens ONE child's world only.
CHILD_COOKIE = "mr_child"
PATTERN_MAX_FAILS = _int("PATTERN_MAX_FAILS", 5)        # wrong patterns before a short break
PATTERN_LOCK_SECONDS = _int("PATTERN_LOCK_SECONDS", 120)
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
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
# Tried in order if the configured model is retired or unavailable (HTTP 404).
GEMINI_FALLBACK_MODELS = [m.strip() for m in os.getenv("GEMINI_FALLBACK_MODELS",
                                                                     "gemini-3.6-flash,gemini-flash-latest,gemini-3.5-flash-lite,gemini-3.1-flash-lite").split(",") if m.strip()]
GEMINI_TIMEOUT = _int("GEMINI_TIMEOUT", 20)
# The companion's voice: Gemini text-to-speech (answers are written by the text model above).
GEMINI_TTS_MODEL = os.getenv("GEMINI_TTS_MODEL", "gemini-3.8-flash-lite-tts")
GEMINI_TTS_FALLBACK_MODELS = [m.strip() for m in os.getenv(
    "GEMINI_TTS_FALLBACK_MODELS", "gemini-3.8-flash-tts,gemini-3.1-flash-tts-preview").split(",") if m.strip()]
# Speak the first sentence separately so the voice starts sooner. Uses 2 TTS requests per answer:
# keep it off on the free tier (10 TTS requests per day per model).
GEMINI_TTS_SPLIT = _bool("GEMINI_TTS_SPLIT", False)
GEMINI_TTS_VOICE = os.getenv("GEMINI_TTS_VOICE", "Puck")
GEMINI_TTS_TIMEOUT = _int("GEMINI_TTS_TIMEOUT", 25)
# Less "thinking" = faster answers for children (minimal | low | medium | high; empty = model default).
GEMINI_THINKING = os.getenv("GEMINI_THINKING", "low").strip()

# ── Rate limits: (requests, window seconds) ──
LIMITS = {
    "login": (10, 15 * 60),
    "unlock": (5, 15 * 60),
    "pattern": (10, 60),
    "register": (5, 60 * 60),
    "chat_minute": (8, 60),
    "chat_day": (80, 24 * 60 * 60),
    "speech_minute": (24, 60),  # two parts per answer
    "chat_ip": (30, 60),
}
