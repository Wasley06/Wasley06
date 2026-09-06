-- Fabegon ERP persistence hardening migration
-- Apply in Supabase SQL Editor before shipping production installers.
-- This file is idempotent — safe to run multiple times on an existing database.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- erp_schedule_events — create if new, then add any missing cols
-- ─────────────────────────────────────────────────────────────
create table if not exists public.erp_schedule_events (
  id   text primary key,
  date date not null,
  title text not null,
  type text not null default 'other',
  created_at timestamptz not null default now()
);

-- Add every optional column individually so an existing table is patched too
alter table public.erp_schedule_events add column if not exists time              text;
alter table public.erp_schedule_events add column if not exists notes             text;
alter table public.erp_schedule_events add column if not exists module            text;
alter table public.erp_schedule_events add column if not exists reference_number  text;
alter table public.erp_schedule_events add column if not exists priority          text not null default 'normal';
alter table public.erp_schedule_events add column if not exists status            text not null default 'open';
alter table public.erp_schedule_events add column if not exists linked_transaction text;
alter table public.erp_schedule_events add column if not exists metadata          jsonb not null default '{}'::jsonb;
alter table public.erp_schedule_events add column if not exists created_by        text;
alter table public.erp_schedule_events add column if not exists updated_at        timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────
-- erp_items — extra columns
-- ─────────────────────────────────────────────────────────────
alter table public.erp_items add column if not exists approval_status text not null default 'Approved';
alter table public.erp_items add column if not exists pending_change  text;
alter table public.erp_items add column if not exists sold_qty        numeric(14,4);
alter table public.erp_items add column if not exists used_qty        numeric(14,4);
alter table public.erp_items add column if not exists received_qty    numeric(14,4);

-- ─────────────────────────────────────────────────────────────
-- erp_journal — extra columns
-- ─────────────────────────────────────────────────────────────
alter table public.erp_journal add column if not exists journal_number       text;
alter table public.erp_journal add column if not exists module               text;
alter table public.erp_journal add column if not exists transaction_reference text;
alter table public.erp_journal add column if not exists narration            text;
alter table public.erp_journal add column if not exists currency             text not null default 'TZS';
alter table public.erp_journal add column if not exists created_by           text;
alter table public.erp_journal add column if not exists audit_reference      text;
alter table public.erp_journal add column if not exists linked_transaction   text;
alter table public.erp_journal add column if not exists status               text not null default 'Posted';
alter table public.erp_journal add column if not exists updated_at           timestamptz not null default now();

-- ─────────────────────────────────────────────────────────────
-- erp_creditors — extra columns
-- ─────────────────────────────────────────────────────────────
alter table public.erp_creditors add column if not exists archived_at     timestamptz;
alter table public.erp_creditors add column if not exists supplier_id     text;
alter table public.erp_creditors add column if not exists transactions    jsonb;
alter table public.erp_creditors add column if not exists payment_history jsonb;
alter table public.erp_creditors add column if not exists opening_balance numeric(14,2);
alter table public.erp_creditors add column if not exists credit_limit    numeric(14,2);
alter table public.erp_creditors add column if not exists contact_person  text;
alter table public.erp_creditors add column if not exists phone           text;
alter table public.erp_creditors add column if not exists email           text;
alter table public.erp_creditors add column if not exists code            text;

-- ─────────────────────────────────────────────────────────────
-- erp_clients — visits JSONB (local-only field persisted here)
-- ─────────────────────────────────────────────────────────────
alter table public.erp_clients add column if not exists visits jsonb;

-- ─────────────────────────────────────────────────────────────
-- erp_sales_orders — payment tracking
-- ─────────────────────────────────────────────────────────────
alter table public.erp_sales_orders add column if not exists amount_paid numeric(14,2);
alter table public.erp_sales_orders add column if not exists balance     numeric(14,2);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────
create unique index if not exists erp_items_sku_unique
  on public.erp_items (sku) where sku is not null and sku <> '';

-- Non-unique index on creditors (duplicate rows exist — unique index would fail)
drop index if exists public.erp_creditors_supplier_name_unique;
create index if not exists erp_creditors_name_type_idx
  on public.erp_creditors (lower(name), type)
  where archived_at is null;

create unique index if not exists erp_journal_journal_number_unique
  on public.erp_journal (journal_number) where journal_number is not null;

create index if not exists erp_schedule_events_date_idx    on public.erp_schedule_events(date desc);
create index if not exists erp_schedule_events_module_idx  on public.erp_schedule_events(module);
create index if not exists erp_schedule_events_status_idx  on public.erp_schedule_events(status);

-- ─────────────────────────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists erp_schedule_events_updated_at on public.erp_schedule_events;
create trigger erp_schedule_events_updated_at
  before update on public.erp_schedule_events
  for each row execute function public.set_updated_at();

drop trigger if exists erp_journal_no_update on public.erp_journal;
create or replace function public.prevent_posted_journal_update()
returns trigger language plpgsql as $$
begin
  if old.status = 'Posted' and new.status = 'Posted' then
    raise exception 'Posted journal entries are immutable; create an authorized reversal instead.';
  end if;
  return new;
end;
$$;
create trigger erp_journal_no_update
  before update on public.erp_journal
  for each row execute function public.prevent_posted_journal_update();

-- ─────────────────────────────────────────────────────────────
-- Row-level security
-- ─────────────────────────────────────────────────────────────
alter table public.erp_schedule_events enable row level security;
do $$ begin
  create policy erp_schedule_events_all on public.erp_schedule_events
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Realtime
-- ─────────────────────────────────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table public.erp_schedule_events;
exception when duplicate_object then null;
end $$;

alter table public.erp_items          replica identity full;
alter table public.erp_creditors       replica identity full;
alter table public.erp_journal         replica identity full;
alter table public.erp_schedule_events replica identity full;
