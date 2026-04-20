-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)

create table if not exists profiles (
  id               uuid references auth.users(id) on delete cascade primary key,
  email            text not null,
  trial_started_at timestamptz not null default now(),
  subscribed       boolean not null default false,
  stripe_customer_id text
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile (triggered on first sign-in)
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile (e.g. email field)
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Service role (used by Stripe webhook) bypasses RLS automatically.
-- No extra policy needed for the webhook's update of subscribed = true.
