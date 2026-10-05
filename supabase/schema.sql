create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'faculty', 'management', 'security', 'student')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.access_rules (
  id text primary key,
  location_id text not null,
  person_type text not null check (person_type in ('Parent', 'Product/Business Visitor', 'Inspirational/Motivational Visitor', 'Faculty/Staff', 'Recruiter', 'General Visitor')),
  allowed boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, person_type)
);

create table if not exists public.visitors (
  id text primary key,
  name text not null,
  email text not null default '',
  mobile text not null default '',
  person_type text not null check (person_type in ('Parent', 'Product/Business Visitor', 'Inspirational/Motivational Visitor', 'Faculty/Staff', 'Recruiter', 'General Visitor')),
  visiting text not null default '',
  purpose text not null default '',
  authorized_location_id text not null default '',
  expected_exit text not null default '',
  check_in bigint not null,
  checked_out_at bigint,
  status text not null check (status in ('Registered', 'Active', 'Checked Out', 'Blocked')),
  verified boolean not null default false,
  "returning" boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.visitors add column if not exists email text not null default '';

create table if not exists public.security_events (
  id text primary key,
  person_id text not null references public.visitors(id) on delete restrict,
  person_name text not null,
  person_type text not null check (person_type in ('Parent', 'Product/Business Visitor', 'Inspirational/Motivational Visitor', 'Faculty/Staff', 'Recruiter', 'General Visitor')),
  camera_id text not null,
  source text check (source is null or source = 'route'),
  location_id text not null,
  location_name text,
  building text not null,
  floor_id text not null,
  room_id text not null,
  access text not null check (access in ('authorized', 'restricted')),
  occurred_at bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id text primary key,
  event_id text not null unique references public.security_events(id) on delete restrict,
  event_snapshot jsonb not null,
  severity text not null check (severity in ('Critical', 'High', 'Medium', 'Low')),
  status text not null check (status in ('Active', 'Acknowledged', 'Resolved')),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists security_events_person_time_idx on public.security_events (person_id, occurred_at desc);
create index if not exists security_events_access_time_idx on public.security_events (access, occurred_at desc);
create index if not exists alerts_status_time_idx on public.alerts (status, created_at desc);
create index if not exists visitors_status_checkin_idx on public.visitors (status, check_in desc);
create index if not exists access_rules_location_idx on public.access_rules (location_id, person_type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists access_rules_set_updated_at on public.access_rules;
create trigger access_rules_set_updated_at before update on public.access_rules for each row execute function public.set_updated_at();
drop trigger if exists visitors_set_updated_at on public.visitors;
create trigger visitors_set_updated_at before update on public.visitors for each row execute function public.set_updated_at();
drop trigger if exists alerts_set_updated_at on public.alerts;
create trigger alerts_set_updated_at before update on public.alerts for each row execute function public.set_updated_at();

create or replace function public.current_campus_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.auth_user_id = auth.uid() limit 1;
$$;


-- Safe role migration: allow Management as a first-class authenticated campus role.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'faculty', 'management', 'security', 'student'));

alter table public.profiles enable row level security;
alter table public.access_rules enable row level security;
alter table public.visitors enable row level security;
alter table public.security_events enable row level security;
alter table public.alerts enable row level security;

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles for select to authenticated using (auth_user_id = auth.uid() or public.current_campus_role() = 'admin');
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated using (public.current_campus_role() = 'admin' and auth_user_id is distinct from auth.uid()) with check (public.current_campus_role() = 'admin' and auth_user_id is distinct from auth.uid());

drop policy if exists access_rules_security_read on public.access_rules;
create policy access_rules_security_read on public.access_rules for select to authenticated using (public.current_campus_role() in ('admin', 'management', 'security'));
drop policy if exists access_rules_security_insert on public.access_rules;
create policy access_rules_security_insert on public.access_rules for insert to authenticated with check (public.current_campus_role() in ('admin', 'management', 'security'));
drop policy if exists access_rules_security_update on public.access_rules;
create policy access_rules_security_update on public.access_rules for update to authenticated using (public.current_campus_role() in ('admin', 'management', 'security')) with check (public.current_campus_role() in ('admin', 'management', 'security'));

drop policy if exists visitors_security_select on public.visitors;
create policy visitors_security_select on public.visitors for select to authenticated using (public.current_campus_role() in ('admin', 'management', 'security'));
drop policy if exists visitors_security_insert on public.visitors;
create policy visitors_security_insert on public.visitors for insert to authenticated with check (public.current_campus_role() in ('admin', 'management', 'security'));
drop policy if exists visitors_security_update on public.visitors;
create policy visitors_security_update on public.visitors for update to authenticated using (public.current_campus_role() in ('admin', 'management', 'security')) with check (public.current_campus_role() in ('admin', 'management', 'security'));

drop policy if exists events_security_select on public.security_events;
create policy events_security_select on public.security_events for select to authenticated using (public.current_campus_role() in ('admin', 'management', 'security'));
drop policy if exists events_security_insert on public.security_events;
create policy events_security_insert on public.security_events for insert to authenticated with check (public.current_campus_role() in ('admin', 'management', 'security'));
drop policy if exists events_security_update on public.security_events;
create policy events_security_update on public.security_events for update to authenticated using (public.current_campus_role() in ('admin', 'management', 'security')) with check (public.current_campus_role() in ('admin', 'management', 'security'));

drop policy if exists alerts_security_select on public.alerts;
create policy alerts_security_select on public.alerts for select to authenticated using (public.current_campus_role() in ('admin', 'management', 'security'));
drop policy if exists alerts_security_insert on public.alerts;
create policy alerts_security_insert on public.alerts for insert to authenticated with check (public.current_campus_role() in ('admin', 'management', 'security'));
drop policy if exists alerts_security_update on public.alerts;
create policy alerts_security_update on public.alerts for update to authenticated using (public.current_campus_role() in ('admin', 'management', 'security')) with check (public.current_campus_role() in ('admin', 'management', 'security'));

revoke all on public.profiles, public.access_rules, public.visitors, public.security_events, public.alerts from anon;
grant select on public.profiles to authenticated;
grant update (role) on public.profiles to authenticated;
grant select, insert, update on public.access_rules, public.visitors, public.security_events, public.alerts to authenticated;
revoke all on function public.current_campus_role() from public;
grant execute on function public.current_campus_role() to authenticated;

insert into public.profiles (id, full_name, email, role) values
  ('10000000-0000-4000-8000-000000000001', 'Admin', 'admin@gmail.com', 'admin'),
  ('10000000-0000-4000-8000-000000000002', 'Faculty', 'faculty@gmail.com', 'faculty'),
  ('10000000-0000-4000-8000-000000000003', 'Security', 'security@gmail.com', 'security'),
  ('10000000-0000-4000-8000-000000000004', 'Student', 'student@gmail.com', 'student')
on conflict (email) do nothing;

with categories(person_type, allowed_locations) as (
  values
    ('Parent', array['main-gate', 'reception', 'meeting-room', 'library']::text[]),
    ('Product/Business Visitor', array['main-gate', 'reception', 'meeting-room', 'placement-cell']::text[]),
    ('Inspirational/Motivational Visitor', array['main-gate', 'reception', 'meeting-room', 'library']::text[]),
    ('Faculty/Staff', array['main-gate', 'reception', 'meeting-room', 'placement-cell', 'cse-lab', 'staff-room']::text[]),
    ('Recruiter', array['main-gate', 'reception', 'meeting-room', 'placement-cell']::text[]),
    ('General Visitor', array['main-gate', 'reception', 'library']::text[])
), locations(location_id) as (
  values ('main-gate'), ('reception'), ('meeting-room'), ('library'), ('placement-cell'), ('cse-lab'), ('staff-room')
)
insert into public.access_rules (id, location_id, person_type, allowed)
select categories.person_type || ':' || locations.location_id, locations.location_id, categories.person_type, locations.location_id = any(categories.allowed_locations)
from categories cross join locations
on conflict (id) do nothing;

-- After creating Auth users, link their UUIDs to these prepared profiles from the SQL editor.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.biometric_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text REFERENCES public.visitors(id) ON DELETE CASCADE,
  provider_reference text,
  status text NOT NULL DEFAULT 'NOT_ENROLLED',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.biometric_profiles
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS visitor_id text REFERENCES public.visitors(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS provider_reference text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'NOT_ENROLLED',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.biometric_profiles
  ALTER COLUMN provider_reference DROP NOT NULL,
  ALTER COLUMN status SET DEFAULT 'NOT_ENROLLED',
  DROP CONSTRAINT IF EXISTS biometric_profiles_status_check;

ALTER TABLE public.biometric_profiles
  ADD CONSTRAINT biometric_profiles_status_check
  CHECK (status IN ('NOT_ENROLLED', 'ENROLLED', 'ERROR', 'enrolled', 'inactive'));

CREATE UNIQUE INDEX IF NOT EXISTS biometric_profiles_visitor_unique ON public.biometric_profiles (visitor_id) WHERE visitor_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.biometric_verification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  visitor_id text REFERENCES public.visitors(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  verification_result text NOT NULL CHECK (verification_result IN ('VERIFIED', 'NOT_VERIFIED', 'NO_ENROLLMENT', 'VERIFICATION_ERROR')),
  destination text,
  access_result text CHECK (access_result IS NULL OR access_result IN ('authorized', 'restricted')),
  camera_id text,
  security_event_id text REFERENCES public.security_events(id) ON DELETE SET NULL,
  occurred_at bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((profile_id IS NULL) <> (visitor_id IS NULL))
);

ALTER TABLE public.biometric_verification_events
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visitor_id text REFERENCES public.visitors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS verification_result text,
  ADD COLUMN IF NOT EXISTS destination text,
  ADD COLUMN IF NOT EXISTS access_result text,
  ADD COLUMN IF NOT EXISTS camera_id text,
  ADD COLUMN IF NOT EXISTS security_event_id text REFERENCES public.security_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS occurred_at bigint,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS biometric_verification_events_identity_time_idx ON public.biometric_verification_events (visitor_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS biometric_profiles_set_updated_at ON public.biometric_profiles;
CREATE TRIGGER biometric_profiles_set_updated_at BEFORE UPDATE ON public.biometric_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.biometric_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_verification_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS biometric_profiles_security_select ON public.biometric_profiles;
CREATE POLICY biometric_profiles_security_select ON public.biometric_profiles FOR SELECT TO authenticated USING (public.current_campus_role() IN ('admin', 'management', 'security'));
DROP POLICY IF EXISTS biometric_profiles_security_insert ON public.biometric_profiles;
CREATE POLICY biometric_profiles_security_insert ON public.biometric_profiles FOR INSERT TO authenticated WITH CHECK (public.current_campus_role() IN ('admin', 'management', 'security'));
DROP POLICY IF EXISTS biometric_profiles_security_update ON public.biometric_profiles;
CREATE POLICY biometric_profiles_security_update ON public.biometric_profiles FOR UPDATE TO authenticated USING (public.current_campus_role() IN ('admin', 'management', 'security')) WITH CHECK (public.current_campus_role() IN ('admin', 'management', 'security'));
DROP POLICY IF EXISTS biometric_profiles_security_delete ON public.biometric_profiles;
CREATE POLICY biometric_profiles_security_delete ON public.biometric_profiles FOR DELETE TO authenticated USING (public.current_campus_role() IN ('admin', 'management', 'security'));

DROP POLICY IF EXISTS biometric_verification_events_security_select ON public.biometric_verification_events;
CREATE POLICY biometric_verification_events_security_select ON public.biometric_verification_events FOR SELECT TO authenticated USING (public.current_campus_role() IN ('admin', 'management', 'security'));
DROP POLICY IF EXISTS biometric_verification_events_security_insert ON public.biometric_verification_events;
CREATE POLICY biometric_verification_events_security_insert ON public.biometric_verification_events FOR INSERT TO authenticated WITH CHECK (public.current_campus_role() IN ('admin', 'management', 'security'));

REVOKE ALL ON public.biometric_profiles, public.biometric_verification_events FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.biometric_profiles TO authenticated;
GRANT SELECT, INSERT ON public.biometric_verification_events TO authenticated;

COMMIT;
