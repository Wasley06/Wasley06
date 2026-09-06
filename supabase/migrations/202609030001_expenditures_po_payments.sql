-- Fabegon ERP — Expenditures table, PO payment columns, Creditor columns
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query → Paste → Run)

-- ─────────────────────────────────────────────────────────────
-- 1. erp_expenditures (new table)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.erp_expenditures (
  id              text primary key,
  date            date not null,
  category        text not null default 'Operations',
  description     text not null,
  amount          numeric(14,2) not null default 0,
  payee           text,
  payment_method  text not null default 'Cash',
  reference       text,
  approved_by     text,
  status          text not null default 'Pending',
  notes           text,
  created_by      text,
  created_at      timestamptz not null default now()
);

-- Row-level security (mirror other erp_ tables)
alter table public.erp_expenditures enable row level security;
drop policy if exists "authenticated_all_expenditures" on public.erp_expenditures;
create policy "authenticated_all_expenditures"
  on public.erp_expenditures for all
  to authenticated using (true) with check (true);

-- ─────────────────────────────────────────────────────────────
-- 2. erp_purchase_orders — payment columns
-- ─────────────────────────────────────────────────────────────
alter table public.erp_purchase_orders
  add column if not exists payment_method        text,
  add column if not exists payment_type          text,
  add column if not exists payment_status        text not null default 'Unpaid',
  add column if not exists amount_paid           numeric(14,2) not null default 0,
  add column if not exists balance               numeric(14,2),
  add column if not exists payment_installments  jsonb,
  add column if not exists received_date         date;

-- ─────────────────────────────────────────────────────────────
-- 3. erp_creditors — extra columns for full data retention
-- ─────────────────────────────────────────────────────────────
alter table public.erp_creditors
  add column if not exists transactions     jsonb,
  add column if not exists payment_history  jsonb,
  add column if not exists opening_balance  numeric(14,2),
  add column if not exists credit_limit     numeric(14,2),
  add column if not exists contact_person   text,
  add column if not exists phone            text,
  add column if not exists email            text,
  add column if not exists code             text,
  add column if not exists type             text not null default 'other';

-- ─────────────────────────────────────────────────────────────
-- 4. erp_clients — ensure visits column exists (local-only field)
-- ─────────────────────────────────────────────────────────────
alter table public.erp_clients
  add column if not exists visits jsonb;

-- ─────────────────────────────────────────────────────────────
-- 5. erp_items — ensure local-only qty columns exist
-- ─────────────────────────────────────────────────────────────
alter table public.erp_items
  add column if not exists sold_qty     numeric(14,4),
  add column if not exists used_qty     numeric(14,4),
  add column if not exists received_qty numeric(14,4);

-- ─────────────────────────────────────────────────────────────
-- 6. erp_sales_orders — ensure amountPaid/balance persist
-- ─────────────────────────────────────────────────────────────
alter table public.erp_sales_orders
  add column if not exists amount_paid numeric(14,2),
  add column if not exists balance     numeric(14,2);

-- ─────────────────────────────────────────────────────────────
-- Done — all columns are idempotent (ADD COLUMN IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────
