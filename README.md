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
| `GEMINI_API_KEY` | AI tutor and voice. Without a key, a built-in offline helper answers with a few fixed facts |
| `GEMINI_MODEL`, `GEMINI_FALLBACK_MODELS`, `GEMINI_THINKING` | Text model: `gemini-3.6-flash` by default. The fallbacks are tried when a model is retired or busy (HTTP 404/429/5xx). `low` thinking gives faster answers |
| `GEMINI_TTS_MODEL`, `GEMINI_TTS_VOICE`, `GEMINI_TTS_SPLIT` | The companion's voice: `gemini-3.8-flash-lite-tts` with the `Puck` voice, plus two fallback TTS models. The browser voice is the last fallback. `GEMINI_TTS_SPLIT=true` starts the voice sooner but uses 2 requests per answer, so only turn it on with billing |

**Free tier limits:** Gemini's free tier allows about 20 text requests and 10 voice requests per model per day. A model that hits its limit is rested until the limit resets, and the next model is used; when all are used up, the companion answers from its offline helper in the child's language. For real use, enable billing on the Google AI project.
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
- **Parent mode (step-up auth)**: parent-only content needs the account password again. This covers the family dashboard, child details and conversations, adding, editing or deleting children, profile changes and orders.
  - Opening a child's play area locks parent mode, and the "Grown-ups" button asks for the password.
  - The unlock is a separate httpOnly cookie (`mr_parent`), bound to the login session, with an idle timeout of `PARENT_UNLOCK_MINUTES` (10 by default). It is rate-limited and checked by the API on every parent route, so typing URLs doesn't bypass it.
  - In child mode, children can still play, talk to their companion and switch their world.
- **Secret picture pattern per child**: each child opens only their own world by tapping 4 pictures (🐱 → ⭐ → 🚀 → 🦖) in the Kids' corner (`/kids`).
  - The pattern is created and confirmed at the end of onboarding (step 9).
  - Only a salted scrypt hash bound to the child id is stored (`mk_children.pattern_hash`), never the pattern, and the API never returns it.
  - The right pattern gives a **child pass**: an httpOnly `mr_child` cookie for that one child, bound to the login session.
  - Every child-data route checks: parent owns the child, then (this child's pass or parent mode). Child A's pass returns `403 child_locked` for child B.
  - Wrong patterns are rate-limited, and after 5 misses there is a 2-minute break (`PATTERN_MAX_FAILS`, `PATTERN_LOCK_SECONDS`).
  - The pattern is the **only** way into a child's world, even for parents: the parent area has no Play button, and opening a world always switches to child mode first. Parents can reset a forgotten pattern (Edit page, then it is re-created with them in the Kids' corner) and delete a child from the dashboard after a confirmation.
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

## 3D companion (replaces the chatbot)

The buddy chosen during onboarding (fox, camel, owl, turtle, lion, monkey, dino, dolphin, cat, unicorn) becomes a full-body 3D companion (`frontend/src/companion/`, three.js, toon-shaded). Each animal is built from primitives, so there are no model files to download.

- **States:** idle, walking, talking, listening, thinking, explaining, celebrating and waving. They blend smoothly, the character blinks, and the mouth moves with the voice (speech word events).
- **Travels with the child:**
  - It floats above everything (it is attached to `<body>`, top z-index).
  - It walks to a new spot when the page changes and wanders now and then.
  - It jumps for joy when the child earns points.
- **The child can move it:** drag it anywhere, or focus it and use the arrow keys. It stays there for about 40 seconds, then goes back to exploring.
- **Talk:**
  1. Tap it and the browser's speech recognition listens. Tap again when done.
  2. The text goes to `/api/chat` with the page, lesson, game and question.
  3. The answer is adapted to the child's age, level, learning profile and context, in "spoken" style.
  4. It is read aloud while the character animates.
  - Typing is the fallback when the microphone is unavailable. Only text reaches the server, never audio.
- **Answers and voice:** a Gemini text model writes the answer, which is shown in the bubble at once. Gemini TTS then speaks it: the first sentence and the rest are synthesised in parallel so the voice starts sooner, and the 3D mouth follows the real audio loudness. Only the companion's own stored answers can be voiced (`POST /api/chat/speech`), and they are cached for replays. `GET /api/health` shows whether the AI is enabled and which model answered.
- **The child's name:** the companion can greet the child and say their first name, but the name is never sent to Gemini. Gemini sees a placeholder (`⟪name⟫`), and the server puts the real name back into the answer.
- **Page awareness:** every child page registers a short descriptor in `companion/PageContext.tsx` and `pageDescriptors.ts`. It lists what is visible, the available actions, where the child can go, page details and the last pages visited. It is sent with each question, so the companion can say "tap the 💡 button" or "go to Rewards". The server sanitises it: only short plain strings, capped lists, anything instruction-like dropped, and it is framed to Gemini as data.
- **Guardrails** (`backend/services/guardrails.py`, EN/FR/AR):
  - Before the AI: unsafe topics (violence, adult content, drugs), attempts to change the companion's rules and shared personal details get a kind, fixed reply, and Gemini is not called. A child who seems upset is told to talk to a grown-up they trust.
  - After the AI: replies that ask for personal information, contain links or unsafe words are replaced or cleaned.
  - The system prompt also keeps the companion on topic, age-appropriate and encouraging, and tells it never to ask personal questions.
- **Games are unchanged:** the in-game Guide uses the companion as its body and voice. Hints, reactions and the game engine are untouched.
- **Lessons:** the Watch → Practice → Discover → Quiz → Done steps are shown as a road map, with the child's avatar on the current stop.

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
