-- ═══════════════════════════════════════════════════════
-- SplitMint — Supabase Database Schema
-- Run this in the Supabase SQL Editor to create all tables
-- ═══════════════════════════════════════════════════════

-- ── Enable UUID extension (usually pre-enabled on Supabase) ─
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. USERS
-- Maps 1-to-1 with auth.users; stores profile data
-- ─────────────────────────────────────────────
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text        not null unique,
  name        text        not null,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

comment on table public.users is 'Public user profiles, linked to Supabase Auth.';

-- ─────────────────────────────────────────────
-- 2. GROUPS
-- A shared expense group (e.g. "Trip to Goa")
-- ─────────────────────────────────────────────
create table public.groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  created_by  uuid not null references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

comment on table public.groups is 'Expense-splitting groups.';

-- ─────────────────────────────────────────────
-- 3. GROUP MEMBERS
-- Junction table: which users belong to which group
-- ─────────────────────────────────────────────
create table public.group_members (
  id        uuid primary key default uuid_generate_v4(),
  group_id  uuid not null references public.groups(id)  on delete cascade,
  user_id   uuid references public.users(id)            on delete cascade, -- Nullable for ghost members
  nickname  text,           -- Required if user_id is null
  color     text,           -- hex colour for UI avatar bubbles
  joined_at timestamptz not null default now(),

  unique (group_id, user_id) -- prevent duplicate membership (only for registered users)
);

comment on table public.group_members is 'Group membership with optional display overrides.';

-- ─────────────────────────────────────────────
-- 4. EXPENSES
-- A single expense within a group
-- ─────────────────────────────────────────────
create type public.split_mode as enum ('equal', 'exact', 'percentage');

create table public.expenses (
  id          uuid primary key default uuid_generate_v4(),
  group_id    uuid          not null references public.groups(id) on delete cascade,
  description text          not null,
  amount      numeric(12,2) not null check (amount > 0),
  paid_by     uuid          not null references public.users(id) on delete set null,
  date        date          not null default current_date,
  split_mode  split_mode    not null default 'equal',
  created_at  timestamptz   not null default now()
);

comment on table public.expenses is 'Individual expenses recorded within a group.';

-- ─────────────────────────────────────────────
-- 5. EXPENSE SPLITS
-- How each expense is divided among participants
-- ─────────────────────────────────────────────
create table public.expense_splits (
  id              uuid primary key default uuid_generate_v4(),
  expense_id      uuid          not null references public.expenses(id) on delete cascade,
  participant_id  uuid          not null references public.users(id)    on delete cascade,
  amount          numeric(12,2) not null check (amount >= 0),
  percentage      numeric(5,2),  -- nullable, used only for percentage-based splits

  unique (expense_id, participant_id)
);

comment on table public.expense_splits is 'Per-participant share of each expense.';

-- ═══════════════════════════════════════════════════════
-- INDEXES  (speed up common queries)
-- ═══════════════════════════════════════════════════════
create index idx_group_members_group   on public.group_members(group_id);
create index idx_group_members_user    on public.group_members(user_id);
create index idx_expenses_group        on public.expenses(group_id);
create index idx_expenses_paid_by      on public.expenses(paid_by);
create index idx_expense_splits_expense on public.expense_splits(expense_id);

-- ═══════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY  (enable on all tables)
-- Policies are intentionally left as stubs — fill in once
-- your auth flow is finalized.
-- ═══════════════════════════════════════════════════════
alter table public.users           enable row level security;
alter table public.groups          enable row level security;
alter table public.group_members   enable row level security;
alter table public.expenses        enable row level security;
alter table public.expense_splits  enable row level security;

-- Example: users can read their own profile
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

-- Example: users can update their own profile
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Example: authenticated users can insert their profile row
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Example: group members can read their group
create policy "Members can view their groups"
  on public.groups for select
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id
        and group_members.user_id = auth.uid()
    )
  );

-- Example: group creator can create groups
create policy "Authenticated users can create groups"
  on public.groups for insert
  with check (auth.uid() = created_by);

-- Example: group members can view members of their groups
create policy "Members can view group members"
  on public.group_members for select
  using (
    exists (
      select 1 from public.group_members as gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
    )
  );

-- Example: group members can view expenses in their groups
create policy "Members can view group expenses"
  on public.expenses for select
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = expenses.group_id
        and group_members.user_id = auth.uid()
    )
  );

-- Example: group members can view expense splits in their groups
create policy "Members can view expense splits"
  on public.expense_splits for select
  using (
    exists (
      select 1 from public.expenses
      join public.group_members on group_members.group_id = expenses.group_id
      where expenses.id = expense_splits.expense_id
        and group_members.user_id = auth.uid()
    )
  );
