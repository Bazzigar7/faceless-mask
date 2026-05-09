-- Phase 2b.1 initial schema
-- See README.md "Database schema" section for shape rationale.
-- Memory table deferred — sessions.summary carries V1 per-session recap.

-- Colleges
create table colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  contact_dean text,
  created_at timestamptz default now()
);

-- Cohorts (a specific group of students at a college)
create table cohorts (
  id uuid primary key default gen_random_uuid(),
  college_id uuid references colleges(id),
  name text not null,
  start_date date,
  current_strength int,
  notes text,
  created_at timestamptz default now()
);

-- Tracks (a thematic series of sessions)
create table tracks (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references cohorts(id),
  name text not null,
  total_sessions int,
  description text,
  status text default 'active',
  created_at timestamptz default now()
);

-- Sessions (individual classes)
create table sessions (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references tracks(id),
  session_number int,
  date timestamptz not null,
  topic text not null,
  brief jsonb,
  transcript text,
  summary text,           -- Claude-generated end-of-session summary, retrieved next session as context
  duration_minutes int,
  highlight_moments jsonb,
  created_at timestamptz default now()
);

-- Asset library
create table assets (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  url text,
  storage_path text,
  tags text[],
  alt_text text,
  added_by text,
  created_at timestamptz default now()
);

-- Session-asset usage
create table asset_usage (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  asset_id uuid references assets(id),
  triggered_at timestamptz,
  trigger_phrase text
);

-- RLS disabled in V1: Mask runs locally on a single user (Baz).
-- When admin route gets a password gate (V2 or public deploy), RLS gets enabled with policies.
alter table colleges disable row level security;
alter table cohorts disable row level security;
alter table tracks disable row level security;
alter table sessions disable row level security;
alter table assets disable row level security;
alter table asset_usage disable row level security;
