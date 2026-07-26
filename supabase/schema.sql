-- ─────────────────────────────────────────────────────────────
-- Campus Handbook — Supabase schema
-- Run this once in the Supabase SQL editor before deploying.
-- The app auto-seeds the default handbook + nyc-2026 on first load.
-- ─────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- The one shared/default handbook, one row per section.
create table if not exists sections (
  key         text primary key,
  group_name  text not null default '',
  title       text not null default '',
  position    integer not null default 0,
  body        text not null default '',
  updated_at  timestamptz not null default now()
);

-- Each campus edition. `fields` fills the {{placeholders}}; `overrides`
-- holds per-section wording changes ({ section_key: { title, body, hidden } }).
create table if not exists locations (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  name        text not null default '',
  edition     text not null default '',
  is_active   boolean not null default true,
  fields      jsonb not null default '{}'::jsonb,
  overrides   jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Google accounts allowed to sign in and edit.
create table if not exists editors (
  email       text primary key,
  added_by    text,
  created_at  timestamptz not null default now()
);

create index if not exists locations_active_code_idx on locations (code) where is_active;

-- Row Level Security: the app talks to Supabase with the service-role key
-- (server-side only), which bypasses RLS. Enabling RLS with no policies means
-- the anon/public key cannot read or write these tables directly.
alter table sections  enable row level security;
alter table locations enable row level security;
alter table editors   enable row level security;
