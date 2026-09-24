"""Minimal Google Gemini REST client. The API key is read from the environment here
and only here; it is sent in a request header and never logged or returned."""
import base64
import logging
import re
import struct
import time

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


_state = {"model": None}
_text_blocked = {}  # model -> time.monotonic() until which it is skipped (quota exhausted)


def enabled():
    return bool(config.GEMINI_API_KEY)


def _models():
    """The model that last worked first, then the configured one, then the fallbacks."""
    order = [_state["model"], config.GEMINI_MODEL, *config.GEMINI_FALLBACK_MODELS]
    return [m for i, m in enumerate(order) if m and m not in order[:i]]


def status():
    """For /api/health: is the AI tutor configured, and which model answered last (never the key)."""
    now = time.monotonic()
    return {"enabled": enabled(), "model": _state["model"] or config.GEMINI_MODEL,
            "resting": sorted(m for m, until in _text_blocked.items() if until > now), "voice": tts_status()}


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
        "generationConfig": {"temperature": 0.6, "maxOutputTokens": 1024,
                             **({"thinkingConfig": {"thinkingLevel": config.GEMINI_THINKING}} if config.GEMINI_THINKING else {})},
    }
    res = None
    now = time.monotonic()
    for model in _models():
        if _text_blocked.get(model, 0) > now:
            continue  # quota used up: skip until it resets
        try:
            res = httpx.post(API.format(model=model), json=body, timeout=config.GEMINI_TIMEOUT,
                             headers={"x-goog-api-key": config.GEMINI_API_KEY})
        except httpx.HTTPError as e:
            log.warning("Gemini request failed: %s", type(e).__name__)
            raise GeminiUnavailable("network") from None
        if res.status_code == 400 and "thinkingConfig" in body["generationConfig"]:
            # This model doesn't support the thinking setting: ask again without it.
            body["generationConfig"].pop("thinkingConfig")
            try:
                res = httpx.post(API.format(model=model), json=body, timeout=config.GEMINI_TIMEOUT,
                                 headers={"x-goog-api-key": config.GEMINI_API_KEY})
            except httpx.HTTPError as e:
                log.warning("Gemini request failed: %s", type(e).__name__)
                raise GeminiUnavailable("network") from None
        if res.status_code == 429:  # over quota: rest this model, try the next one
            wait = _retry_seconds(res)
            _text_blocked[model] = time.monotonic() + wait
            log.warning("Gemini model %s is over its quota: resting for %ss, trying the next model", model, wait)
            continue
        if res.status_code in (404, 500, 503):  # retired or overloaded: try the next model
            log.warning("Gemini model %s answered HTTP %s, trying the next model", model, res.status_code)
            continue
        if res.status_code == 200:
            _state["model"] = model  # remember the model that works
        break
    if res is None or res.status_code != 200:
        status = res.status_code if res is not None else "none"
        # Log Google's error status only (the body may echo the request; the key is never logged).
        reason = ""
        try:
            reason = (res.json().get("error") or {}).get("status", "") if res is not None else ""
        except ValueError:
            pass
        log.warning("Gemini returned HTTP %s %s: the companion uses offline answers", status, reason)
        raise GeminiUnavailable(f"http {status}")
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


# ─────────────── Text-to-speech (the companion's voice) ───────────────

_EMOJI = re.compile(r"[\U0001F000-\U0001FAFF\u2600-\u27BF\uFE0F\u200D]")
_tts_state = {"model": None}
_tts_blocked = {}  # model -> time.monotonic() until which it is skipped (quota exhausted)


def _retry_seconds(res):
    """How long Google asks us to wait after a 429 (a per-day quota means: try again in an hour)."""
    try:
        details = res.json().get("error", {}).get("details", [])
    except ValueError:
        return 60
    per_day = any("PerDay" in (v.get("quotaId") or "") for d in details for v in d.get("violations", []))
    if per_day:
        return 3600
    delay = next((d.get("retryDelay") for d in details if d.get("retryDelay")), "60s")
    try:
        return max(5, int(float(str(delay).rstrip("s"))))
    except ValueError:
        return 60


def tts_status():
    now = time.monotonic()
    return {"model": _tts_state["model"] or config.GEMINI_TTS_MODEL,
            "resting": sorted(m for m, until in _tts_blocked.items() if until > now)}


def _wav(pcm, rate=24000):
    """Wrap raw 16-bit mono PCM in a WAV header."""
    header = b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVEfmt " + struct.pack("<IHHIIHH", 16, 1, 1, rate, rate * 2, 2, 16)
    return header + b"data" + struct.pack("<I", len(pcm)) + pcm


def synthesize(text):
    """Speak `text` with a Gemini TTS voice. Returns WAV bytes. Raises GeminiUnavailable."""
    if not enabled():
        raise GeminiUnavailable("GEMINI_API_KEY is not set")
    text = _EMOJI.sub("", text or "").strip()[:700]
    if not text:
        raise GeminiUnavailable("empty")
    body = {"contents": [{"role": "user", "parts": [{"text": text}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": config.GEMINI_TTS_VOICE}}}}}
    order = [_tts_state["model"], config.GEMINI_TTS_MODEL, *config.GEMINI_TTS_FALLBACK_MODELS]
    now = time.monotonic()
    for model in [m for i, m in enumerate(order) if m and m not in order[:i]]:
        if _tts_blocked.get(model, 0) > now:
            continue  # quota used up: don't waste time asking again
        try:
            res = httpx.post(API.format(model=model), json=body, timeout=config.GEMINI_TTS_TIMEOUT,
                             headers={"x-goog-api-key": config.GEMINI_API_KEY})
        except httpx.HTTPError as e:
            log.warning("Gemini TTS request failed: %s", type(e).__name__)
            raise GeminiUnavailable("network") from None
        if res.status_code == 429:
            wait = _retry_seconds(res)
            _tts_blocked[model] = time.monotonic() + wait
            log.warning("Gemini TTS model %s is over its quota: resting for %ss, trying the next model", model, wait)
            continue
        if res.status_code in (404, 500, 503):
            log.warning("Gemini TTS model %s answered HTTP %s, trying the next model", model, res.status_code)
            continue
        if res.status_code != 200:
            log.warning("Gemini TTS returned HTTP %s", res.status_code)
            raise GeminiUnavailable(f"http {res.status_code}")
        parts = ((res.json().get("candidates") or [{}])[0].get("content") or {}).get("parts") or []
        audio = next((p["inlineData"] for p in parts if "inlineData" in p), None)
        if not audio:
            raise GeminiUnavailable("no audio")
        data = base64.b64decode(audio.get("data", ""))
        _tts_state["model"] = model
        if data[:4] == b"RIFF":
            return data
        rate = re.search(r"rate=(\d+)", audio.get("mimeType", ""))
        return _wav(data, int(rate.group(1)) if rate else 24000)
    raise GeminiUnavailable("no tts model available")

