-- Run this in the Supabase SQL editor for your project.
-- Enable UUID generation
create extension if not exists "pgcrypto";

-- One row per signed-up user (parent or child), 1:1 with auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('parent', 'child')),
  full_name text not null,
  avatar_emoji text default '🙂',
  created_at timestamptz not null default now()
);

-- A "family" or "job" owned by a parent/employer
create table groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade unique,
  name text not null, -- e.g. "The Smith Household" or "Downtown Cafe"
  join_code text unique, -- null when regeneration is turned off/paused
  code_regenerates boolean not null default true,
  code_generated_at timestamptz not null default now(),
  accent_theme text not null default 'matcha',
  created_at timestamptz not null default now()
);

-- Links a child/worker profile to a group.
-- Rows can exist BEFORE the child signs up (pre-invite), in which case
-- profile_id is null and invite_token is used instead.
create table memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  display_name text not null, -- set by parent at pre-invite time, or by child on join
  invite_token uuid, -- used for "add early, invite without a code" flow
  joined_at timestamptz,
  points integer not null default 0,
  streak_count integer not null default 0,
  last_full_day_date date, -- last date every chore due that day was approved
  created_at timestamptz not null default now(),
  unique (group_id, profile_id)
);

create table chores (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  membership_id uuid not null references memberships(id) on delete cascade,
  created_by uuid not null references profiles(id),
  title text not null,
  description text,
  requires_photo boolean not null default false,
  due_date date not null,
  recurrence text not null default 'once' check (recurrence in ('once','daily','weekly')),
  recurrence_group_id uuid, -- links generated instances of the same repeating chore together
  created_at timestamptz not null default now()
);

create table chore_submissions (
  id uuid primary key default gen_random_uuid(),
  chore_id uuid not null references chores(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','submitted','approved','needs_redo')),
  photo_url text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  review_note text,
  updated_at timestamptz not null default now()
);

-- Row Level Security: parents see their own group's data,
-- children see only their own membership's data.
alter table profiles enable row level security;
alter table groups enable row level security;
alter table memberships enable row level security;
alter table chores enable row level security;
alter table chore_submissions enable row level security;

create policy "profiles are self-readable" on profiles
  for select using (auth.uid() = id);

create policy "users can create their own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "parents manage their own groups" on groups
  for all using (owner_id = auth.uid());

create or replace function public.is_group_owner(gid uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from groups where id = gid and owner_id = auth.uid());
$$;

create or replace function public.is_group_member(gid uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from memberships where group_id = gid and profile_id = auth.uid());
$$;

create policy "members of a group can read the group's basic info" on groups
  for select using (public.is_group_member(id));

create policy "parents manage memberships in their groups" on memberships
  for all using (public.is_group_owner(group_id));

create policy "children read their own membership" on memberships
  for select using (profile_id = auth.uid());

create policy "parents manage chores in their groups" on chores
  for all using (
    exists (select 1 from groups g where g.id = chores.group_id and g.owner_id = auth.uid())
  );

create policy "children read their own chores" on chores
  for select using (
    exists (select 1 from memberships m where m.id = chores.membership_id and m.profile_id = auth.uid())
  );

create policy "parents manage submissions in their groups" on chore_submissions
  for all using (
    exists (
      select 1 from chores c join groups g on g.id = c.group_id
      where c.id = chore_submissions.chore_id and g.owner_id = auth.uid()
    )
  );

create policy "children manage their own submissions" on chore_submissions
  for all using (
    exists (
      select 1 from chores c join memberships m on m.id = c.membership_id
      where c.id = chore_submissions.chore_id and m.profile_id = auth.uid()
    )
  );
