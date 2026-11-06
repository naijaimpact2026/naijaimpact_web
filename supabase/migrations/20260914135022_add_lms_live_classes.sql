-- "Upcoming Live Classes" for the Learn page right rail. New, real table
-- (not a fabricated UI element) — seeded with a few sample sessions since
-- there's no scheduling/instructor-booking flow yet to populate it for real.

create table if not exists public.lms_live_classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instructor_name text not null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  is_virtual boolean not null default true,
  register_url text,
  created_at timestamptz not null default now()
);

alter table public.lms_live_classes enable row level security;

drop policy if exists "live classes are publicly readable" on public.lms_live_classes;
create policy "live classes are publicly readable"
  on public.lms_live_classes for select
  using (true);

insert into public.lms_live_classes (title, instructor_name, scheduled_at, duration_minutes)
values
  ('How to Start a Lucrative Online Business', 'Ada Eze', now() + interval '6 days', 60),
  ('Introduction to AI for Beginners', 'Tunde K.', now() + interval '8 days', 45),
  ('Financial Literacy for Young Adults', 'Grace O.', now() + interval '11 days', 60)
on conflict do nothing;
