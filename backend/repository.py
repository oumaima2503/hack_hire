"""Storage layer: Supabase when credentials are set, otherwise an in-memory store
pre-loaded with the demo content (so the app runs before Supabase is configured).

The in-memory store can persist to a JSON file (MEMORY_DB_PATH) so parent accounts
survive a dev-server restart. Content tables are always rebuilt from code."""
import copy
import json
import logging
import os
import threading
import time
import uuid
from collections import defaultdict
from datetime import datetime, timezone

from content import build_content
from learning_content import build_learning_content

log = logging.getLogger(__name__)


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def _content_tables():
    return {**build_content(), **build_learning_content()}


class MemoryRepository:
    name = "memory"

    def __init__(self, path=None):
        self._lock = threading.Lock()
        self._path = path
        self._tables = defaultdict(list)
        if path and os.path.exists(path):
            try:
                with open(path, encoding="utf-8") as f:
                    self._tables.update(json.load(f))
            except (OSError, ValueError) as e:
                log.warning("Could not load %s (%s); starting empty", path, e)
        self._content = _content_tables()
        self._tables.update(copy.deepcopy(self._content))

    def _save(self):
        if not self._path:
            return
        data = {t: rows for t, rows in self._tables.items() if t not in self._content}
        tmp = f"{self._path}.tmp"
        os.makedirs(os.path.dirname(os.path.abspath(self._path)), exist_ok=True)
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
        os.replace(tmp, self._path)

    def insert(self, table, row):
        row = {"id": str(uuid.uuid4()), "created_at": now_iso(), **row}
        with self._lock:
            self._tables[table].append(row)
            self._save()
        return copy.deepcopy(row)

    def update(self, table, row_id, patch):
        with self._lock:
            for row in self._tables[table]:
                if row["id"] == row_id:
                    row.update(patch)
                    self._save()
                    return copy.deepcopy(row)
        return None

    def delete(self, table, **eq):
        with self._lock:
            before = len(self._tables[table])
            self._tables[table] = [r for r in self._tables[table] if not all(r.get(k) == v for k, v in eq.items())]
            self._save()
            return before - len(self._tables[table])

    def get(self, table, row_id):
        rows = self.select(table, id=row_id)
        return rows[0] if rows else None

    def select(self, table, **eq):
        with self._lock:
            return [copy.deepcopy(r) for r in self._tables[table]
                    if all(r.get(k) == v for k, v in eq.items())]


class SupabaseRepository:
    """Talks to Supabase over PostgREST.

    Robustness: one client per thread over HTTP/1.1 (the shared HTTP/2 connection
    dropped under Flask's concurrent requests: "Server disconnected"), retries on
    transient network errors, and an in-process cache for the static content
    tables, which every page reads many times."""
    name = "supabase"
    PAGE = 1000
    RETRIES = 3
    CONTENT_TABLES = frozenset({"mk_adventures", "mk_missions", "mk_box_items", "mk_lessons", "mk_games",
                                "mk_questions", "mk_rewards", "mk_achievements"})
    CONTENT_TTL = 300  # seconds; re-run seed.py and wait (or restart) to see content edits

    def __init__(self, url, key):
        self._url, self._key = url, key
        self._local = threading.local()
        self._cache, self._cache_lock = {}, threading.Lock()

    def _client(self, fresh=False):
        if fresh or getattr(self._local, "client", None) is None:
            import httpx
            from supabase import create_client
            try:
                from supabase import SyncClientOptions as Options
            except ImportError:  # older supabase-py
                from supabase import ClientOptions as Options
            http = httpx.Client(http2=False, timeout=httpx.Timeout(20.0, connect=10.0),
                                limits=httpx.Limits(max_keepalive_connections=5, keepalive_expiry=20))
            self._local.client = create_client(self._url, self._key, options=Options(httpx_client=http))
        return self._local.client

    def _run(self, build):
        """build(client) -> PostgREST query; executed with retries on dropped connections."""
        import httpx
        for attempt in range(self.RETRIES):
            try:
                return build(self._client(fresh=attempt > 0)).execute()
            except (httpx.TransportError, httpx.RemoteProtocolError) as e:
                if attempt == self.RETRIES - 1:
                    raise
                log.warning("Supabase connection issue (%s), retrying", type(e).__name__)
                time.sleep(0.2 * (attempt + 1))

    def _invalidate(self, table):
        if table in self.CONTENT_TABLES:
            with self._cache_lock:
                self._cache.pop(table, None)

    def insert(self, table, row):
        self._invalidate(table)
        return self._run(lambda c: c.table(table).insert(row)).data[0]

    def upsert(self, table, rows):
        self._invalidate(table)
        return self._run(lambda c: c.table(table).upsert(rows, on_conflict="id")).data

    def update(self, table, row_id, patch):
        self._invalidate(table)
        data = self._run(lambda c: c.table(table).update(patch).eq("id", row_id)).data
        return data[0] if data else None

    def delete(self, table, **eq):
        self._invalidate(table)

        def build(c):
            q = c.table(table).delete()
            for k, v in eq.items():
                q = q.eq(k, v)
            return q
        return len(self._run(build).data or [])

    def get(self, table, row_id):
        if table in self.CONTENT_TABLES:
            return next(iter(self.select(table, id=row_id)), None)
        data = self._run(lambda c: c.table(table).select("*").eq("id", row_id).limit(1)).data
        return data[0] if data else None

    def _fetch_all(self, table, **eq):
        rows, start = [], 0
        while True:
            def build(c, start=start):
                q = c.table(table).select("*")
                for k, v in eq.items():
                    q = q.eq(k, v)
                return q.range(start, start + self.PAGE - 1)
            page = self._run(build).data
            rows.extend(page)
            if len(page) < self.PAGE:
                return rows
            start += self.PAGE

    def select(self, table, **eq):
        if table not in self.CONTENT_TABLES:
            return self._fetch_all(table, **eq)
        with self._cache_lock:
            hit = self._cache.get(table)
        if not hit or time.monotonic() - hit[0] > self.CONTENT_TTL:
            hit = (time.monotonic(), self._fetch_all(table))
            with self._cache_lock:
                self._cache[table] = hit
        return [copy.deepcopy(r) for r in hit[1] if all(r.get(k) == v for k, v in eq.items())]


def get_repository():
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if url and key and os.getenv("STORAGE", "").lower() != "memory":
        return SupabaseRepository(url, key)
    return MemoryRepository(os.getenv("MEMORY_DB_PATH") or None)
