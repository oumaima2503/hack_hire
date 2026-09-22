-- My Rugy Kids – pre-launch funnel data model (Day 1 report, D1.4)
-- Run this once in the Supabase SQL editor, then run `python seed.py` from /backend.

create extension if not exists "pgcrypto";

-- ───────────── Written by the website ─────────────

create table if not exists mk_parents (
  id               uuid primary key default gen_random_uuid(),
  email            text not null,
  full_name        text,
  consent_given    boolean not null default false,
  consent_at       timestamptz,
  consent_version  text,
  created_at       timestamptz not null default now(),
  constraint consent_required check (consent_given = true)
);

create table if not exists mk_children (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null references mk_parents(id) on delete cascade,
  name        text not null,
  avatar_key  text,
  age_band    text check (age_band in ('3-5', '6-8', '9-11')),
  level       smallint check (level between 1 and 3),
  interests   text[] not null default '{}',
  language    text check (language in ('en', 'fr', 'ar')),
  created_at  timestamptz not null default now()
);

-- ───────────── Content prepared by the team ─────────────

create table if not exists mk_adventures (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  description      text,
  interest_tags    text[] not null default '{}',
  cover_image_url  text,
  is_active        boolean not null default true,
  is_generic       boolean not null default false,
  translations     jsonb not null default '{}'::jsonb   -- {"fr": {"title": …}, "ar": {…}}
);

create table if not exists mk_missions (
  id             uuid primary key default gen_random_uuid(),
  adventure_id   uuid not null references mk_adventures(id) on delete cascade,
  title          text not null,
  activity_type  text not null,
  difficulty     smallint not null check (difficulty between 1 and 3),
  age_band       text not null check (age_band in ('3-5', '6-8', '9-11')),
  content        jsonb not null default '{}'::jsonb,
  translations   jsonb not null default '{}'::jsonb
);

create table if not exists mk_box_items (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  interest_tag  text not null,   -- an interest key, 'generic', or 'name_card'
  age_band      text not null check (age_band in ('3-5', '6-8', '9-11', 'all')),
  image_url     text,
  translations  jsonb not null default '{}'::jsonb
);

-- ───────────── Orders & evidence ─────────────

create table if not exists mk_orders (
  id                uuid primary key default gen_random_uuid(),
  parent_id         uuid not null references mk_parents(id) on delete cascade,
  child_id          uuid not null references mk_children(id) on delete cascade,
  adventure_id      uuid references mk_adventures(id),
  variant           text not null check (variant in ('personalised', 'generic')),
  amount            numeric(10, 2) not null,
  shipping_address  jsonb not null,
  status            text not null default 'pending' check (status in ('pending', 'confirmed')),
  created_at        timestamptz not null default now()
);

create table if not exists mk_relevance_ratings (
  id             uuid primary key default gen_random_uuid(),
  child_id       uuid not null references mk_children(id) on delete cascade,
  variant_shown  text not null check (variant_shown in ('personalised', 'generic')),
  shown_order    smallint not null check (shown_order in (1, 2)),
  score          smallint not null check (score between 1 and 5),
  created_at     timestamptz not null default now()
);

create table if not exists mk_funnel_events (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  child_id    uuid references mk_children(id) on delete set null,
  event_name  text not null,
  step        smallint,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists mk_funnel_events_event_idx on mk_funnel_events (event_name, step);
create index if not exists mk_funnel_events_session_idx on mk_funnel_events (session_id);
create index if not exists mk_children_parent_idx on mk_children (parent_id);
create index if not exists mk_missions_lookup_idx on mk_missions (adventure_id, age_band, difficulty);

-- Only the Flask backend (service_role key) talks to the database.
-- RLS on with no policies = the public anon key cannot read or write anything.
alter table mk_parents            enable row level security;
alter table mk_children           enable row level security;
alter table mk_adventures         enable row level security;
alter table mk_missions           enable row level security;
alter table mk_box_items          enable row level security;
alter table mk_orders             enable row level security;
alter table mk_relevance_ratings  enable row level security;
alter table mk_funnel_events      enable row level security;

-- ═══════════════════════════════════════════════════════════════════
-- v2 · Parent accounts, learning journey, games, rewards, AI tutor
-- Idempotent: safe to run on a database that already has v1.
-- ═══════════════════════════════════════════════════════════════════

-- Parents become accounts (full_name = account name).
alter table mk_parents add column if not exists password_hash text;
create unique index if not exists mk_parents_email_account_idx
  on mk_parents (lower(email)) where password_hash is not null;

-- Children: personalisation choices + cached points total.
alter table mk_children add column if not exists age             smallint check (age between 3 and 12);
alter table mk_children add column if not exists learning_style  text check (learning_style in ('watch', 'listen', 'do'));
alter table mk_children add column if not exists favorite_color  text;
alter table mk_children add column if not exists rug_style       text check (rug_style in ('berber', 'kilim', 'floral', 'modern'));
alter table mk_children add column if not exists selected_theme  text;
alter table mk_children add column if not exists total_points    integer not null default 0;

-- ───────────── Learning content (seeded by backend/seed.py) ─────────────
create table if not exists mk_lessons (
  id         uuid primary key default gen_random_uuid(),
  key        text unique not null,
  position   smallint not null,
  title      text not null,
  emoji      text,
  summary    text,
  content    jsonb not null default '{}'::jsonb,   -- explain{1,2,3}, analogy, storyboard, cards
  video_url  text
);

create table if not exists mk_games (
  id         uuid primary key default gen_random_uuid(),
  key        text unique not null,
  lesson_id  uuid references mk_lessons(id) on delete set null,
  type       text not null check (type in ('choose_material', 'match_tools', 'build_pattern', 'order_steps', 'create_rug', 'challenge')),
  title      text not null,
  emoji      text,
  config     jsonb not null default '{}'::jsonb
);

create table if not exists mk_questions (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references mk_lessons(id) on delete cascade,
  kind         text not null default 'quiz' check (kind in ('quiz', 'material')),
  difficulty   smallint not null check (difficulty between 1 and 3),
  prompt       text not null,
  options      jsonb not null,
  answer       text not null,          -- never sent to the browser
  hint         text,
  explanation  text
);

create table if not exists mk_rewards (
  id         uuid primary key default gen_random_uuid(),
  key        text unique not null,
  kind       text not null check (kind in ('color', 'pattern', 'character', 'design', 'theme', 'workshop')),
  name       text not null,
  emoji      text,
  threshold  integer not null,
  payload    jsonb not null default '{}'::jsonb
);

create table if not exists mk_achievements (
  id           uuid primary key default gen_random_uuid(),
  key          text unique not null,
  title        text not null,
  description  text,
  emoji        text,
  rule         jsonb not null            -- {"type": "lessons_completed", "count": 4}
);

-- ───────────── Per-child progress (all cascade with the child) ─────────────
create table if not exists mk_child_progress (
  id             uuid primary key default gen_random_uuid(),
  child_id       uuid not null references mk_children(id) on delete cascade,
  lesson_id      uuid not null references mk_lessons(id) on delete cascade,
  status         text not null default 'started' check (status in ('started', 'completed')),
  video_watched  boolean not null default false,
  quiz_correct   smallint not null default 0,
  quiz_total     smallint not null default 0,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  unique (child_id, lesson_id)
);

create table if not exists mk_child_game_progress (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references mk_children(id) on delete cascade,
  game_id       uuid not null references mk_games(id) on delete cascade,
  plays         integer not null default 0,
  best_score    integer not null default 0,
  max_score     integer not null default 0,
  completed     boolean not null default false,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  unique (child_id, game_id)
);

create table if not exists mk_child_answers (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references mk_children(id) on delete cascade,
  question_id  uuid not null references mk_questions(id) on delete cascade,
  choice       text not null,
  correct      boolean not null,
  created_at   timestamptz not null default now()
);

create table if not exists mk_points_ledger (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references mk_children(id) on delete cascade,
  reason      text not null,
  points      integer not null,
  ref         text,
  created_at  timestamptz not null default now()
);

create table if not exists mk_child_rewards (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references mk_children(id) on delete cascade,
  reward_id   uuid not null references mk_rewards(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (child_id, reward_id)
);

create table if not exists mk_child_achievements (
  id              uuid primary key default gen_random_uuid(),
  child_id        uuid not null references mk_children(id) on delete cascade,
  achievement_id  uuid not null references mk_achievements(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (child_id, achievement_id)
);

create table if not exists mk_created_rugs (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references mk_children(id) on delete cascade,
  name        text not null,
  design      jsonb not null,
  created_at  timestamptz not null default now()
);

create table if not exists mk_chat_sessions (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references mk_children(id) on delete cascade,
  lesson_key  text,
  created_at  timestamptz not null default now()
);

create table if not exists mk_chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references mk_chat_sessions(id) on delete cascade,
  child_id    uuid not null references mk_children(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

create table if not exists mk_revoked_tokens (
  id          uuid primary key default gen_random_uuid(),
  jti         text unique not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists mk_ledger_child_idx      on mk_points_ledger (child_id, created_at);
create index if not exists mk_answers_child_idx     on mk_child_answers (child_id, question_id);
create index if not exists mk_rugs_child_idx        on mk_created_rugs (child_id);
create index if not exists mk_chat_messages_idx     on mk_chat_messages (session_id, created_at);
create index if not exists mk_questions_lesson_idx  on mk_questions (lesson_id, kind, difficulty);

alter table mk_lessons             enable row level security;
alter table mk_games               enable row level security;
alter table mk_questions           enable row level security;
alter table mk_rewards             enable row level security;
alter table mk_achievements        enable row level security;
alter table mk_child_progress      enable row level security;
alter table mk_child_game_progress enable row level security;
alter table mk_child_answers       enable row level security;
alter table mk_points_ledger       enable row level security;
alter table mk_child_rewards       enable row level security;
alter table mk_child_achievements  enable row level security;
alter table mk_created_rugs        enable row level security;
alter table mk_chat_sessions       enable row level security;
alter table mk_chat_messages       enable row level security;
alter table mk_revoked_tokens      enable row level security;
