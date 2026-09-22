"""Push the demo content (adventures, missions, Box items) to Supabase. Safe to re-run."""
import os
import sys

from dotenv import load_dotenv

load_dotenv()

from content import build_content  # noqa: E402
from repository import SupabaseRepository  # noqa: E402

if __name__ == "__main__":
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not (url and key):
        sys.exit("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env first.")
    repo = SupabaseRepository(url, key)
    for table, rows in build_content().items():  # adventures first: missions reference them
        repo.upsert(table, rows)
        print(f"{table}: {len(rows)} rows")
