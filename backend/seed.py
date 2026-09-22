"""Push the demo content (funnel adventures + rug-making course) to Supabase. Safe to re-run."""
import os
import sys

from dotenv import load_dotenv

load_dotenv()

from content import build_content  # noqa: E402
from learning_content import build_learning_content  # noqa: E402
from repository import SupabaseRepository  # noqa: E402

if __name__ == "__main__":
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not (url and key):
        sys.exit("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env first.")
    repo = SupabaseRepository(url, key)
    # Dict order respects foreign keys (adventures → missions, lessons → games/questions).
    for table, rows in {**build_content(), **build_learning_content()}.items():
        repo.upsert(table, rows)
        print(f"{table}: {len(rows)} rows")
