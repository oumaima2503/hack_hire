"""Storage layer: Supabase when credentials are set, otherwise an in-memory store
pre-loaded with the demo content (so the app runs before Supabase is configured)."""
import copy
import os
import threading
import uuid
from datetime import datetime, timezone

from content import build_content


def now_iso():
    return datetime.now(timezone.utc).isoformat()


class MemoryRepository:
    name = "memory"

    def __init__(self):
        self._lock = threading.Lock()
        self._tables = {t: [] for t in (
            "mk_parents", "mk_children", "mk_orders", "mk_relevance_ratings", "mk_funnel_events")}
        self._tables.update(build_content())

    def insert(self, table, row):
        row = {"id": str(uuid.uuid4()), "created_at": now_iso(), **row}
        with self._lock:
            self._tables[table].append(row)
        return copy.deepcopy(row)

    def update(self, table, row_id, patch):
        with self._lock:
            for row in self._tables[table]:
                if row["id"] == row_id:
                    row.update(patch)
                    return copy.deepcopy(row)
        return None

    def get(self, table, row_id):
        rows = self.select(table, id=row_id)
        return rows[0] if rows else None

    def select(self, table, **eq):
        with self._lock:
            return [copy.deepcopy(r) for r in self._tables[table]
                    if all(r.get(k) == v for k, v in eq.items())]


class SupabaseRepository:
    name = "supabase"
    PAGE = 1000

    def __init__(self, url, key):
        from supabase import create_client
        self.client = create_client(url, key)

    def insert(self, table, row):
        return self.client.table(table).insert(row).execute().data[0]

    def upsert(self, table, rows):
        return self.client.table(table).upsert(rows, on_conflict="id").execute().data

    def update(self, table, row_id, patch):
        data = self.client.table(table).update(patch).eq("id", row_id).execute().data
        return data[0] if data else None

    def get(self, table, row_id):
        data = self.client.table(table).select("*").eq("id", row_id).limit(1).execute().data
        return data[0] if data else None

    def select(self, table, **eq):
        rows, start = [], 0
        while True:
            q = self.client.table(table).select("*")
            for k, v in eq.items():
                q = q.eq(k, v)
            page = q.range(start, start + self.PAGE - 1).execute().data
            rows.extend(page)
            if len(page) < self.PAGE:
                return rows
            start += self.PAGE


def get_repository():
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if url and key:
        return SupabaseRepository(url, key)
    return MemoryRepository()
