create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.story_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  genre text not null,
  summary text not null,
  stripe_checkout_session_id text unique,
  stripe_payment_status text not null default 'unpaid',
  story_status text not null default 'draft' check (
    story_status in ('draft', 'pending_payment', 'paid', 'sent_to_n8n', 'failed')
  ),
  n8n_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists story_orders_user_created_idx
  on public.story_orders(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists story_orders_set_updated_at on public.story_orders;
create trigger story_orders_set_updated_at
before update on public.story_orders
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.story_orders enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can read own orders" on public.story_orders;
create policy "Users can read own orders"
on public.story_orders
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own orders" on public.story_orders;
create policy "Users can create own orders"
on public.story_orders
for insert
with check (auth.uid() = user_id);
