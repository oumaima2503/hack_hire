# MyRugy Kids

A personalised rug-making learning platform for children, with parent accounts, and the Day 1 pre-launch funnel.
**Flask** API · **React + TypeScript (Vite)** · **Supabase** (PostgreSQL) · **Google Gemini** (server-side only).

Architecture, schema, endpoints and middleware: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```
Landing → parent account (consent) → name+buddy → age → islands → world+colour → learning+rug style → mini-challenges → language
        → /play/:childId  personalised world: Home · Learn (8 stages) · Games · Create My Rug · Rewards · Progress · Ask the guide
Parent:   /parent  children cards → progress detail (lessons, games, achievements, rugs, assistant chats) · edit · delete · add child
Funnel:   /adventure (personalised vs generic Box) → Payzone demo → /confirmed · /parent-test · /dashboard
```

## Run locally

Backend (`backend/`):

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python app.py
```

Frontend (from the project root or `frontend/`):

```bash
npm install --prefix frontend
npm run dev
```

Open http://localhost:5173. Tests: `cd backend && python -m pytest -q`.

## Configuration (`backend/.env`, never committed)

| Variable | Purpose |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase storage. Leave empty (or set `STORAGE=memory`) to use the in-memory store |
| `MEMORY_DB_PATH` | In-memory mode: saves accounts and progress to a JSON file |
| `JWT_SECRET` | ≥ 32 characters. **Required** when `APP_ENV=production` |
| `COOKIE_SECURE` | `true` behind HTTPS |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | AI tutor. Without a key, a built-in offline helper answers from the lesson hints |
| `POINTS_CONFIG`, `POINTS_PER_LEVEL`, `RUG_POINTS_DAILY_CAP` | Configurable points values |

## Supabase

1. In the SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql). It is safe to re-run and upgrades a v1 database.
2. Set the keys in `backend/.env`, then load the content (adventures, lessons, questions, games, rewards, achievements):
   ```bash
   python seed.py
   ```
3. Restart Flask. The dashboard shows `storage: supabase`.

Row-level security is on for every table with no policies, so only the backend's secret key can read or write.

## Security

- **Passwords** are hashed with scrypt. **JWT** (HS256, 12 h) sits in an `httpOnly`, `SameSite=Strict` cookie that JavaScript can't read. Logout revokes the token's id.
- **Guards** run in this order on every private route: `authenticate_parent → authorize_parent → verify_child_ownership`. A child that isn't yours returns **404**, and `parentId` is never read from the request.
- **CSRF**: cookie-authenticated requests that change data must send `X-Requested-With`.
- **Rate limits** apply to login, register and chat (per IP and per child).
- **Validation**: every input is validated against a whitelist and sanitised.
- **Server-side checks**: quiz answers never reach the browser, and game results and points are checked on the server.
- **Gemini** is called only by the backend. The child's name is never sent, emails and phone numbers are removed, strict safety settings apply, quiz mode gives hints rather than answers, and parents can read every conversation.

## Personalisation

`GET /api/children/:id/experience` turns the stored profile into the interface:

| Choice | Changes |
|---|---|
| World (space, ocean, dinosaurs, jungle, desert, fairy tale; magic carpet unlocks at 750) | Colours, background animation, guide character, nav icons, points vocabulary, examples in lessons and games, stickers |
| Favourite colour | Accent colour and the first colour of every palette |
| Age + measured difficulty | Explanation depth (3 reading levels), quiz length, game size (pairs, steps, pattern length), timer speed |
| Learning style | Section order in lessons (story first, explanation first with read-aloud, or tap cards first) |
| Rug style | Shapes and colours in Build the Pattern and the Rug Studio, design tips |
| Buddy, interests, language | Avatar and stickers, the funnel adventure and Box, and the assistant's reply language |

## Learning Profile & MyRugy Guide (AI layer on top of the games)

The six games (Choose Materials, Match Tools, Build Pattern, Order Steps, Rug Studio, Challenge) keep their mechanics, content, scoring and progression. The Guide only helps around them (`frontend/src/guide/`, `backend/services/guide_service.py`).

- **Onboarding:** consent → name → age → interests → world → learning style → language → **mini-challenges** → **Learning Profile**. The mini-challenges are onboarding only: one visual puzzle per skill (patterns, sequencing, visual matching, materials), with one retry. The result is saved as `mk_children.learning_profile` and served by `GET /api/children/:id/learning-profile`. Children see an adventure level, what they're good at and what to practise, never a score.
- **Personalisation (how things are explained, never which game):**
  - Learning style sets how each game is introduced: Watch = demo first, Listen = spoken, Do = try first.
  - Age sets how long explanations are and whether they are read aloud.
  - Skills and repeated mistakes set when the Guide offers help: after 1, 2 or 3 mistakes.
- **First-time game intro:** goal → a short demo (a hand points if the child hesitates) → a mini try → "Your turn!". Children can replay it with ❔.
- **During play:**
  - 💡 progressive hints (`POST /api/children/:id/games/:key/hint`): 1 encouragement, 2 a clue, 3 specific guidance. They are computed from the game engine's own data and never give the answer.
  - 💬 Ask and optional 🎤 voice (browser speech recognition), answered by the Gemini tutor with the profile and game state.
  - Reactions to mistakes and successes.
- **Boundaries:** the Guide never decides correctness, gives rewards or changes game state. The existing engine stays the authority.
- **Languages:** the Guide's texts are in EN/FR/AR. Lesson and game content is still English.

## Regional journey across Morocco

The 8-stage course is also a trip through all **12 regions of Morocco** (`backend/services/regions_service.py`).

- **Route:** it starts in the child's home region (optional, asked on the age step and editable by parents; Marrakech-Safi if not set). It heads for the nearer end of the country first, then flies to the other side, so every region is visited once.
- **Stops:** each lesson hosts 1–2 regions (1·2·1·2·1·2·1·2). Each stop shows that region's style, city, colours and a fun fact. Its text matches the lesson topic: materials in *Choose Materials*, technique in *Learn the Tools*, motifs in *Prepare the Design*, and so on.
- **Quiz questions:** each region adds its own question to the lesson quiz and to the Great Challenge, checked on the server like the others.
- **Rewards:** finishing a lesson marks its regions as visited. Their colours and emblems join the rug studio palette, and there are achievements for 6 and 12 regions.
- **Where it shows:** a map with the route on the home and Learn pages, a 📍 banner on each lesson, a passport on the Progress page and in the parent's child view, and the region count on the parent dashboard.
- **Map:** the outline is drawn from Natural Earth data (public domain), with Morocco and its southern provinces as one country. Each region is placed at its representative city's real latitude and longitude. To regenerate `frontend/src/learn/moroccoMap.ts`, run `python scripts/build_morocco_map.py countries-50m.json` (file from `world-atlas@2`).
- **Region cards:** each region has a description, a style theme (look, story, tags, colours) and a mini rug preview drawn in that style (`frontend/src/learn/regionRug.ts`). You see them by tapping a region on the map, on a lesson's stop, or on a passport stamp.
- **Editing content:** it lives in `REGIONS` in `backend/learning_content.py`. Run `supabase/schema.sql` (v3 section) and then `python seed.py` to push it to Supabase.

## Not done yet

- Lesson and game text is English only. The onboarding and funnel are EN/FR/AR, and the assistant answers in the child's language.
- Lesson "videos" are narrated animated storyboards. Set `mk_lessons.video_url` to play real videos.
- Rate limits are counted per server process (revoked tokens are stored in the database). Use Redis if you run several instances.
