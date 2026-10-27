-- Hubnovo redesign: additive fields for the new Home + Profile pages.
-- Nothing existing is dropped or altered — only new nullable/defaulted columns
-- and a new user_badges table.

alter table public.users
  add column if not exists cover_url text,
  add column if not exists location text,
  add column if not exists website_url text,
  add column if not exists quote text,
  add column if not exists skills text[] not null default '{}',
  add column if not exists impact_points integer not null default 0,
  add column if not exists people_reached integer not null default 0,
  add column if not exists people_trained integer not null default 0,
  add column if not exists jobs_created integer not null default 0,
  add column if not exists communities_impacted integer not null default 0;

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  badge_key text not null,
  label text not null,
  icon text,
  awarded_at timestamptz not null default now()
);

create index if not exists user_badges_user_id_idx on public.user_badges(user_id);

alter table public.user_badges enable row level security;

drop policy if exists "badges are publicly readable" on public.user_badges;
create policy "badges are publicly readable"
  on public.user_badges for select
  using (true);
