# MyRugy Kids v2: learning platform architecture

This extends the Day 1 funnel (landing → onboarding → personalised proposal → Payzone demo → dashboard).
It adds parent accounts, several children per parent, a personalised rug-making course, games, rewards and a Gemini tutor.
Nothing in the funnel is removed. The anonymous step 0 becomes **parent registration**, and every child endpoint now requires the parent's JWT.

## 1. Database schema (Supabase, `supabase/schema.sql`, safe to re-run)

**Existing tables, extended rather than duplicated**
- `mk_parents` + `password_hash`, and `full_name` is used as the account name. Emails are unique among registered accounts.
- `mk_children` + `age`, `learning_style`, `favorite_color`, `rug_style`, `selected_theme`, `total_points` (a cache of the points ledger). `level` stays the *difficulty* (1–3, measured by the mini-challenges). The XP level is derived from points.

**Content tables (seeded by `seed.py`, editable by the team)**
- `mk_lessons` (key, position, title, emoji, content jsonb with explanations per reading level, storyboard "video", cards, analogy template, optional `video_url`)
- `mk_games` (key, lesson_id, type, title, config jsonb: tool pairs, process steps…)
- `mk_questions` (lesson_id, kind `quiz`|`material`, difficulty, prompt, options, answer, hint, explanation). **Answers never leave the server.**
- `mk_rewards` (key, kind `color|pattern|character|design|theme|workshop`, threshold, payload)
- `mk_achievements` (key, title, emoji, rule jsonb such as `{"type":"lessons_completed","count":4}`)

**Per-child tables (all `child_id → mk_children.id ON DELETE CASCADE`)**
- `mk_child_progress` (lesson status, video watched, quiz score): one row per child and lesson
- `mk_child_game_progress` (plays, best score, completed): one row per child and game
- `mk_child_answers` (question answers, so points for a correct answer are only given the first time)
- `mk_points_ledger` (every point award with a reason: source of truth for points, streaks and daily caps)
- `mk_child_rewards`, `mk_child_achievements`, `mk_created_rugs` (design jsonb)
- `mk_chat_sessions` → `mk_chat_messages`
- `mk_revoked_tokens` (JWT ids revoked at logout)

## 2. Entity relationships

```
mk_parents 1──< mk_children 1──< mk_child_progress >──1 mk_lessons 1──< mk_questions
                     │      1──< mk_child_game_progress >──1 mk_games >──1 mk_lessons
                     │      1──< mk_child_answers >──1 mk_questions
                     │      1──< mk_points_ledger
                     │      1──< mk_child_rewards >──1 mk_rewards
                     │      1──< mk_child_achievements >──1 mk_achievements
                     │      1──< mk_created_rugs
                     │      1──< mk_chat_sessions 1──< mk_chat_messages
                     └──< mk_orders, mk_relevance_ratings, mk_funnel_events (funnel)
```

## 3. API endpoints

| Area | Endpoint | Guards |
|---|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` | rate-limited |
| | `GET /api/auth/me`, `POST /api/auth/logout` | authenticate |
| Parent | `GET/POST /api/parents/children`, `GET/PUT/DELETE /api/parents/children/:childId` | auth + authorize (+ ownership) |
| | `GET /api/parents/dashboard` | auth + authorize |
| Child (onboarding) | `PATCH /api/children/:childId`, `GET /api/children/:childId` | auth + authorize + ownership |
| Learning | `GET /api/children/:id/experience` (theme, difficulty, progress) | ″ |
| | `GET /api/children/:id/lessons`, `GET …/lessons/:key`, `GET …/lessons/:key/quiz` | ″ |
| | `POST …/lessons/:key/video-watched`, `POST …/lessons/:key/complete` | ″ |
| | `POST /api/children/:id/questions/:qid/answer` | ″ |
| | `GET …/games`, `GET …/games/:key`, `POST …/games/:key/complete` | ″ |
| | `GET/POST …/rugs`, `GET …/rewards`, `GET …/progress` | ″ |
| Chat | `POST /api/chat`, `GET /api/chat/history?childId=` | ″ + rate limit |
| Funnel | `GET …/proposal`, `POST /api/orders` (+`/pay`), `POST /api/ratings` | ″ |
| | `POST /api/events`, `GET /api/dashboard` (aggregates only, no personal data) | public |

## 4. Middleware (Flask decorators, `backend/middleware/`)

```
Request → csrf_guard (before_request) → @authenticate_parent → @authorize_parent → @verify_child_ownership → @rate_limit → route → service → repository
```
- `authenticate_parent`: reads the JWT from the httpOnly cookie (or `Authorization: Bearer`). It verifies the signature, expiry, issuer and that the token id hasn't been revoked, loads the parent and sets `g.parent`.
- `authorize_parent`: checks the role claim is `parent` and the account has given consent.
- `verify_child_ownership`: takes `childId` from the URL, query or body. It returns **404** unless `child.parent_id == g.parent.id`, and sets `g.child`. `parentId` is never read from the client.
- `rate_limit(name, limit, window, key)`: sliding window, applied to login, register and chat.
- `csrf_guard`: cookie-authenticated requests that change data must send `X-Requested-With`. The cookie is also `SameSite=Strict`.

## 5. Backend layout

```
backend/
  app.py                 create_app(): config, CORS, security headers, blueprints
  config.py              env config, POINTS (configurable), JWT, Gemini, limits
  repository.py          Memory (optionally persisted to JSON) / Supabase repository
  content.py             funnel content (adventures, missions, Box)
  learning_content.py    themes, lessons, questions, games, rewards, achievements
  recommend.py           funnel proposal logic
  validators.py          input validation and sanitising
  middleware/auth.py     authenticate_parent, authorize_parent, verify_child_ownership, csrf
  middleware/rate_limit.py
  services/auth_service.py       hashing (scrypt), JWT
  services/learning_service.py   personalisation, progress, points, unlocks, achievements
  services/games_service.py      game configs and server-side answer checks
  services/chat_service.py       child context → prompt, offline fallback
  services/gemini_client.py      REST call to Gemini (API key only here)
  routes/{funnel,auth,parents,children,learning,chat}.py
```

## 6. Frontend layout

```
src/
  api.ts  auth.tsx  state.tsx  i18n.tsx  content.ts
  components/  Layout, Rugy, ExplorerCard, ProposalView, RequireAuth, AuthForms, RugView
  learn/       LearnLayout (theme + nav), ThemeBackdrop, LearnContext, Celebrate, ChatWidget,
               Storyboard, QuestionRunner, TapCards
  games/       ChooseMaterial, MatchTools, BuildPattern, OrderSteps, RugStudio, Challenge
  pages/       funnel pages + AuthPage
  pages/learn/ Home, Journey, Lesson, Games, GamePage, Studio, Rewards, Progress, Assistant
  pages/parent/ ParentDashboard, ChildDetail, ChildEdit
```

## 7. Gemini integration

The React app calls `POST /api/chat` with `{message, childId, lessonId, gameKey, questionId}`. On the server:
1. The JWT is checked, the parent's role is checked, the child's ownership is checked, and the rate limit is applied (per child and per IP).
2. The message is sanitised: control characters are removed, it is capped at 500 characters, and emails and phone numbers are **replaced** before anything is sent.
3. The context is built **without the child's name**: age, difficulty, theme vocabulary, interests, learning style, current lesson, game or quiz question with its hint (**never the answer**), completed lessons, next lesson, points.
4. The system prompt covers: kid-safe, short, uses the child's theme, answers in the child's language, only talks about rug making, gives hints rather than answers during quizzes, never asks for personal information.
5. `gemini_client` sends a REST request with the `x-goog-api-key` header, taken from the `GEMINI_API_KEY` environment variable, with strict safety settings.
6. Messages are saved in `mk_chat_*` so parents can review them. If there is no key or an error, an offline helper built from the lesson hints answers instead.

## 8. Child learning flow

Landing → register/log in (step 0) → name + buddy → age → islands → **world + favourite colour** → **learning style + rug style** → mini-challenges (difficulty) → language → **`/play/:childId`** (a themed home with the journey map)
→ lesson (explanation at the child's reading level, animated storyboard "video", tap cards, quiz with hints) → game → points → unlocks and achievements → rug studio (saved designs) → progress.
Lessons unlock in order. The chat assistant is available on every page.

## 9. Parent dashboard flow

`/login` → `/parent` (a card per child: level, points, lessons x/8, games, unlocks, achievements, latest rug)
→ ▶ Play (child mode) · Progress (`/parent/children/:id`: lessons, games, achievements, rugs, assistant chats) · Edit/Delete · ➕ Add child (the onboarding flow).
In child mode, going back to the parent area goes through a "grown-up gate" (a multiplication question). This is a UX barrier on a shared device, not a security boundary. The security boundary is the parent account, checked on the server.

## 10. Implementation plan

1. Schema and migrations, learning content, repository (`delete`, JSON persistence).
2. Config, auth service, middleware, auth and parent routes. Move the funnel routes onto auth.
3. Learning and games services and routes (personalisation, points, unlocks, achievements).
4. Gemini client, chat service and route.
5. Frontend: auth provider, onboarding step 0 and new steps, parent pages.
6. Frontend: learning layout and theme, lessons, 5 games + challenge, studio, rewards, progress, chat.
7. End-to-end tests: security (another parent's child → 404), points, unlocks, build.
