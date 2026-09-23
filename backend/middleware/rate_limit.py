"""Sliding-window rate limiter (per process). For several server instances,
swap the store for Redis; the decorator interface stays the same."""
import threading
import time
from collections import defaultdict, deque
from functools import wraps

from flask import g, request

import config
from validators import ApiError

_hits = defaultdict(deque)
_lock = threading.Lock()


def client_ip():
    return request.remote_addr or "unknown"


def hit(bucket, key, limit, window):
    """Record a request; raise 429 when the bucket is full."""
    now = time.monotonic()
    k = (bucket, key)
    with _lock:
        q = _hits[k]
        while q and now - q[0] > window:
            q.popleft()
        if len(q) >= limit:
            retry = int(window - (now - q[0])) + 1
            raise ApiError(f"Too many requests, please wait {retry}s and try again", 429)
        q.append(now)


def rate_limit(*rules):
    """rules: (limit_name, key_fn). key_fn runs after the auth guards, so it may use g."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            for name, key_fn in rules:
                limit, window = config.LIMITS[name]
                hit(name, key_fn(), limit, window)
            return fn(*args, **kwargs)
        return wrapper
    return decorator


by_ip = client_ip


def by_parent():
    return g.parent["id"]


def by_child():
    return g.child["id"]


def reset():
    """Test helper."""
    with _lock:
        _hits.clear()
