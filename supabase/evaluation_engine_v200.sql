-- Futures Academy v2.0 Foundation
-- Evaluation accounts, rules, and secure account creation.
-- Run once in Supabase SQL Editor after your existing profile schema.

begin;

create type public.evaluation_status as enum ('active', 'passed', 'failed', 'archived');

create table if not exists public.evaluation_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_type text not null check (
    account_type in ('starter','growth','pro','elite','challenge')
  ),
  starting_balance numeric(14,2) not null,
  current_balance numeric(14,2) not null,
  peak_balance numeric(14,2) not null,
  daily_start_balance numeric(14,2) not null,
  best_day_profit numeric(14,2) not null default 0,
  total_profit numeric(14,2) not null default 0,
  profit_target numeric(14,2) not null,
  max_drawdown numeric(14,2) not null,
  daily_loss_limit numeric(14,2) not null,
  consistency_percent numeric(5,2) not null,
  max_contracts integer not null,
  status public.evaluation_status not null default 'active',
  failed_reason text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists one_active_evaluation_per_user
on public.evaluation_accounts(user_id)
where status = 'active';

create index if not exists evaluation_accounts_user_idx
on public.evaluation_accounts(user_id, started_at desc);

alter table public.evaluation_accounts enable row level security;

drop policy if exists "Users view own evaluations"
on public.evaluation_accounts;

create policy "Users view own evaluations"
on public.evaluation_accounts
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

grant select on public.evaluation_accounts to authenticated;

create or replace function public.start_evaluation(
  requested_account_type text
)
returns public.evaluation_accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
  config record;
  created public.evaluation_accounts;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into profile_row
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;

  select * into config
  from (
    values
      ('starter', 10000::numeric, 600::numeric, 600::numeric, 300::numeric, 30::numeric, 1, 0),
      ('growth', 25000::numeric, 1500::numeric, 1500::numeric, 750::numeric, 30::numeric, 3, 500),
      ('pro', 50000::numeric, 3000::numeric, 2500::numeric, 1250::numeric, 30::numeric, 5, 2500),
      ('elite', 100000::numeric, 6000::numeric, 4000::numeric, 2000::numeric, 25::numeric, 10, 8000),
      ('challenge', 150000::numeric, 9000::numeric, 5000::numeric, 2500::numeric, 25::numeric, 15, 20000)
  ) as rules(
    account_type,
    starting_balance,
    profit_target,
    max_drawdown,
    daily_loss_limit,
    consistency_percent,
    max_contracts,
    reputation_required
  )
  where account_type = requested_account_type;

  if not found then
    raise exception 'Unknown evaluation account';
  end if;

  if coalesce(profile_row.reputation, 0) < config.reputation_required then
    raise exception 'Not enough reputation for this evaluation';
  end if;

  update public.evaluation_accounts
  set status = 'archived',
      completed_at = now(),
      updated_at = now()
  where user_id = auth.uid()
    and status = 'active';

  insert into public.evaluation_accounts (
    user_id,
    account_type,
    starting_balance,
    current_balance,
    peak_balance,
    daily_start_balance,
    profit_target,
    max_drawdown,
    daily_loss_limit,
    consistency_percent,
    max_contracts
  )
  values (
    auth.uid(),
    config.account_type,
    config.starting_balance,
    config.starting_balance,
    config.starting_balance,
    config.starting_balance,
    config.profit_target,
    config.max_drawdown,
    config.daily_loss_limit,
    config.consistency_percent,
    config.max_contracts
  )
  returning * into created;

  return created;
end;
$$;

revoke all on function public.start_evaluation(text) from public, anon;
grant execute on function public.start_evaluation(text) to authenticated;

commit;
