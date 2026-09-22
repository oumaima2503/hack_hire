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
