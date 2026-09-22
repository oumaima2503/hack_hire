# MyRugy Kids · Join the expedition

Pre-launch funnel with a personalised onboarding for My Rugy (Hack&Hire, Day 1 report).
**Flask** API · **React + TypeScript (Vite)** · **Supabase** (PostgreSQL).

```
Landing ─► Step 0 grown-up + consent ─► 1 name/avatar ─► 2 age ─► 3 islands ─► 4 mini-challenges ─► 5 language
        ─► Personalised (or generic) adventure ─► Simulated Payzone checkout ─► Confirmed
Parent test (blind A/B relevance rating) · Team dashboard (funnel + D1.2 thresholds)
```

## Run it locally

**1. Backend** (from `backend/`)

```bash
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env          # leave Supabase keys empty to use the in-memory demo store
python app.py                   # http://127.0.0.1:5000
```

**2. Frontend** (from `frontend/`)

```bash
npm install
npm run dev                     # http://localhost:5173  (proxies /api to Flask)
```

## Connect Supabase

1. Create a project and open **SQL Editor**, then run [`supabase/schema.sql`](supabase/schema.sql).
2. In `backend/.env`, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (from Project Settings → API).
3. Load the demo content: `python seed.py` (adventures, missions, Box items; safe to re-run).
4. Restart Flask. `GET /api/health` and the dashboard badge now show `storage: supabase`.

RLS is on for every table with no policies, so only the Flask backend (service role) can read or write.
The service-role key must never go in the React app.

## Pages

| Route | What it does |
|---|---|
| `/` | Landing page with one conversion action. `?variant=generic` puts the session in the control group |
| `/onboarding` | Steps 0–5. Consent is written before any child data is stored |
| `/adventure` | Result screen: the adventure, first mission and Box change with the profile |
| `/checkout` → `/confirmed` | Simulated Payzone payment, clearly labelled as a demo. `mk_orders` goes from pending to confirmed |
| `/parent-test` | The parent rates the personalised and generic screens 1–5, in random order, with no labels |
| `/dashboard` | Distinct sessions per funnel step, drop-off, completion rate and relevance gap compared with the targets |

## How personalisation works (`backend/recommend.py`)

| Profile field | Drives |
|---|---|
| `interests[]` | The adventure theme (tag overlap; ties go to the first island picked) and 2 Box items |
| `age_band` | Mission format (3–5 read-along, 6–8 puzzle quests, 9–11 design studio), mission choice and Box items |
| `level` (from the mini-challenges) | First mission difficulty |
| `language` | Language of the result screen and Box contents (EN / FR / AR, RTL supported) |
| `name`, `avatar_key` | Explorer card and name card in the Box |

The **generic** control uses the same layout and price, with the `is_generic` adventure, a mid-level 6–8 mission and neutral Box items.

## API

`POST /api/events` · `POST /api/parents` · `POST /api/children` · `PATCH /api/children/:id` ·
`GET /api/children/:id/proposal?variant=personalised|generic&lang=` · `POST /api/orders` ·
`POST /api/orders/:id/pay` · `POST /api/ratings` · `GET /api/dashboard` · `GET /api/health`

## To confirm with My Rugy

Age bands (3–5 / 6–8 / 9–11), the definition of level, supported languages, Box contents and price (299 MAD is a placeholder), the thresholds (+1 point, 70%), and whether a phone number is needed. All the demo content lives in `backend/content.py`.
