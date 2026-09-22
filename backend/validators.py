"""Input validation and sanitisation shared by every route."""
import re
import unicodedata
import uuid

from flask import request


class ApiError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message, self.status = message, status


def require(cond, message, status=400):
    if not cond:
        raise ApiError(message, status)


def json_body():
    data = request.get_json(silent=True)
    require(isinstance(data, dict), "JSON body required")
    return data


def is_uuid(value):
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, TypeError):
        return False


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_CONTROL = {"Cc", "Cf", "Cs", "Co", "Cn"}


def clean_text(value, max_len, *, allow_newlines=False):
    """Strip control/invisible characters, collapse whitespace and cap length."""
    text = unicodedata.normalize("NFC", str(value or ""))
    text = "".join(ch for ch in text if (allow_newlines and ch == "\n") or unicodedata.category(ch) not in _CONTROL
                   or ch in "‍️")  # keep emoji joiners
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()[:max_len]


def valid_email(value):
    email = clean_text(value, 254).lower()
    require(EMAIL_RE.match(email), "Please enter a valid email")
    return email


def valid_password(value):
    pw = str(value or "")
    require(8 <= len(pw) <= 128, "Password must be 8-128 characters")
    require(re.search(r"[A-Za-z]", pw) and re.search(r"\d", pw), "Password needs at least one letter and one number")
    return pw


_EMAIL_ANY = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")
_PHONE = re.compile(r"(?:\+?\d[\d\s().-]{7,}\d)")


def redact_personal_info(text):
    """Remove emails and phone numbers before a child's message leaves our server."""
    return _PHONE.sub("[hidden]", _EMAIL_ANY.sub("[hidden]", text))
