"""Minimal Google Gemini REST client. The API key is read from the environment here
and only here; it is sent in a request header and never logged or returned."""
import logging

import httpx

import config

log = logging.getLogger(__name__)
API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
SAFETY = [{"category": c, "threshold": "BLOCK_LOW_AND_ABOVE"} for c in (
    "HARM_CATEGORY_HARASSMENT", "HARM_CATEGORY_HATE_SPEECH",
    "HARM_CATEGORY_SEXUALLY_EXPLICIT", "HARM_CATEGORY_DANGEROUS_CONTENT")]


class GeminiUnavailable(Exception):
    pass


class GeminiBlocked(Exception):
    pass


def enabled():
    return bool(config.GEMINI_API_KEY)


def generate(system_prompt, history, message):
    """history: [{"role": "user"|"assistant", "content": str}], oldest first."""
    if not enabled():
        raise GeminiUnavailable("GEMINI_API_KEY is not set")
    contents = [{"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]}
                for m in history]
    contents.append({"role": "user", "parts": [{"text": message}]})
    body = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "safetySettings": SAFETY,
        "generationConfig": {"temperature": 0.6, "maxOutputTokens": 1024},
    }
    try:
        res = httpx.post(API.format(model=config.GEMINI_MODEL), json=body, timeout=config.GEMINI_TIMEOUT,
                         headers={"x-goog-api-key": config.GEMINI_API_KEY})
    except httpx.HTTPError as e:
        log.warning("Gemini request failed: %s", type(e).__name__)
        raise GeminiUnavailable("network") from None
    if res.status_code != 200:
        log.warning("Gemini returned HTTP %s", res.status_code)  # body may echo the request; don't log it
        raise GeminiUnavailable(f"http {res.status_code}")
    data = res.json()
    if data.get("promptFeedback", {}).get("blockReason"):
        raise GeminiBlocked()
    candidate = (data.get("candidates") or [{}])[0]
    if candidate.get("finishReason") in ("SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII"):
        raise GeminiBlocked()
    text = "".join(p.get("text", "") for p in candidate.get("content", {}).get("parts", []) if not p.get("thought"))
    if not text.strip():
        raise GeminiUnavailable("empty")
    return text.strip()
