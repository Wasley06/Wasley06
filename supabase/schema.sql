-- ═══════════════════════════════════════════════════════════
-- Fabegon ERP — Supabase Schema v2
-- Run this entire script in: Supabase Dashboard → SQL Editor
-- After running:
--   Auth → Settings → Disable "Enable email confirmations"
-- ═══════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Clean up existing tables (idempotent re-run) ──────────
drop table if exists public.erp_audit_log           cascade;
drop table if exists public.erp_categories          cascade;
drop table if exists public.erp_production_batches  cascade;
drop table if exists public.erp_leads               cascade;
drop table if exists public.erp_purchase_orders     cascade;
drop table if exists public.erp_sales_orders        cascade;
drop table if exists public.erp_notifications       cascade;
drop table if exists public.erp_schedules           cascade;
drop table if exists public.erp_journal             cascade;
drop table if exists public.erp_employees           cascade;
drop table if exists public.erp_creditors           cascade;
drop table if exists public.erp_suppliers           cascade;
drop table if exists public.erp_clients             cascade;
drop table if exists public.erp_items               cascade;
drop table if exists public.profiles                cascade;

-- ── Helper: auto-update updated_at ────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Profiles (linked to auth.users) ───────────────────────
create table public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  username   text unique not null,
  full_name  text not null default '',
  role       text not null default 'Employee'
             check (role in (
               'Super Admin','Admin','Finance Manager','Accountant',
               'HR Manager','Procurement Officer','Warehouse Officer',
               'Production Manager','Sales Manager','Sales Rep',
               'Storekeeper','Cashier','Auditor','Quality Control',
               'Customer Support','Branch Manager','Employee'
             )),
  phone      text not null default '',
  status     text not null default 'Active'
             check (status in ('Active','Suspended')),
  department text not null default '',
  branch     text not null default 'Main Branch',
  employee_id text unique,
  last_login timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Auto-create profile on Supabase Auth signup
-- IMPORTANT: on conflict (existing profile), only update non-role fields
-- to prevent the trigger from overwriting a manually set role.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text;
begin
  -- Validate role is in allowed set, fallback to 'Employee'
  v_role := coalesce(new.raw_user_meta_data->>'role', 'Employee');
  if v_role not in (
    'Super Admin','Admin','Finance Manager','Accountant',
    'HR Manager','Procurement Officer','Warehouse Officer',
    'Production Manager','Sales Manager','Sales Rep',
    'Storekeeper','Cashier','Auditor','Quality Control',
    'Customer Support','Branch Manager','Employee'
  ) then v_role := 'Employee'; end if;

  insert into public.profiles (id, username, full_name, role, phone, status, department, branch)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    v_role,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'Active',
    coalesce(new.raw_user_meta_data->>'department', ''),
    coalesce(new.raw_user_meta_data->>'branch', 'Main Branch')
  )
  -- On conflict: preserve the existing role — don't overwrite it with metadata
  on conflict (id) do update set
    username   = excluded.username,
    full_name  = excluded.full_name,
    phone      = excluded.phone,
    department = excluded.department,
    branch     = excluded.branch;
    -- role is intentionally NOT updated here
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Dynamic Inventory Categories ─────────────────────────
create table public.erp_categories (
  id         text primary key,
  name       text not null,
  parent_id  text references public.erp_categories(id) on delete set null,
  color      text not null default '#3D7FFF',
  icon       text not null default 'Package',
  description text,
  archived   boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger erp_categories_updated_at before update on public.erp_categories
  for each row execute procedure public.set_updated_at();

-- ── Audit Log ─────────────────────────────────────────────
create table public.erp_audit_log (
  id          text primary key,
  actor_id    uuid references auth.users(id) on delete set null,
  actor_name  text not null,
  actor_role  text not null,
  action      text not null,
  entity      text,
  entity_id   text,
  old_value   text,
  new_value   text,
  note        text,
  ip          text,
  created_at  timestamptz default now()
);

create index erp_audit_log_actor_idx  on public.erp_audit_log(actor_id);
create index erp_audit_log_action_idx on public.erp_audit_log(action);
create index erp_audit_log_time_idx   on public.erp_audit_log(created_at desc);

-- ── Inventory Items ────────────────────────────────────────
create table public.erp_items (
  id           text primary key,
  name         text not null,
  sku          text,
  barcode      text,
  category     text not null default 'General',
  category_id  text references public.erp_categories(id) on delete set null,
  warehouse    text not null default 'Main Warehouse',
  location     text,
  storage_bin  text,
  qty          numeric not null default 0 check (qty >= 0),
  min_qty      numeric not null default 0 check (min_qty >= 0),
  max_qty      numeric,
  unit         text not null default 'pcs',
  cost         numeric not null default 0 check (cost >= 0),
  price        numeric not null default 0 check (price >= 0),
  reorder      numeric not null default 0 check (reorder >= 0),
  batch_number text,
  produced_at  text,
  expiry       text,
  supplier     text,
  description  text,
  notes        text,
  status       text not null default 'Active' check (status in ('Active','Inactive','Discontinued')),
  /* Approval workflow */
  approval_status  text not null default 'Approved' check (approval_status in ('Approved','Pending Approval','Rejected')),
  pending_change   jsonb,
  approved_by      uuid references auth.users(id) on delete set null,
  approved_at      timestamptz,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create trigger erp_items_updated_at before update on public.erp_items
  for each row execute procedure public.set_updated_at();

-- ── Clients (CRM / Sales) ─────────────────────────────────
create table public.erp_clients (
  id           text primary key,
  name         text not null,
  email        text,
  phone        text,
  address      text,
  credit_limit numeric not null default 0 check (credit_limit >= 0),
  status       text not null default 'Active' check (status in ('Active','Inactive')),
  notes        text,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create trigger erp_clients_updated_at before update on public.erp_clients
  for each row execute procedure public.set_updated_at();

-- ── Suppliers (Procurement) ───────────────────────────────
create table public.erp_suppliers (
  id         text primary key,
  name       text not null,
  contact    text,
  phone      text,
  email      text,
  category   text not null default 'General',
  terms      text,
  status     text not null default 'Active' check (status in ('Active','Inactive')),
  notes      text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger erp_suppliers_updated_at before update on public.erp_suppliers
  for each row execute procedure public.set_updated_at();

-- ── Creditors (Finance) ───────────────────────────────────
create table public.erp_creditors (
  id         text primary key,
  name       text not null,
  type       text not null default 'Payable' check (type in ('Payable','Receivable','Loan')),
  amount     numeric not null default 0,
  due_date   text,
  status     text not null default 'Pending' check (status in ('Pending','Paid','Overdue','Partial')),
  notes      text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger erp_creditors_updated_at before update on public.erp_creditors
  for each row execute procedure public.set_updated_at();

-- ── Employees (HR) ────────────────────────────────────────
create table public.erp_employees (
  id         text primary key,
  name       text not null,
  dept       text not null default 'General',
  role       text not null default 'Staff',
  email      text,
  phone      text,
  status     text not null default 'Active' check (status in ('Active','Inactive','On Leave')),
  joined     text,
  salary     numeric,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger erp_employees_updated_at before update on public.erp_employees
  for each row execute procedure public.set_updated_at();

-- ── Journal Entries (Finance) ─────────────────────────────
create table public.erp_journal (
  id          text primary key,
  date        text not null,
  ref         text,
  description text not null,
  debit       numeric not null default 0 check (debit >= 0),
  credit      numeric not null default 0 check (credit >= 0),
  type        text not null default 'General' check (type in ('General','Sales','Purchase','Payroll','Expense','Receipt')),
  module      text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

-- ── Notifications ─────────────────────────────────────────
create table public.erp_notifications (
  id         text primary key,
  type       text not null default 'info' check (type in ('info','success','warning','error')),
  title      text not null,
  body       text,
  module     text,
  read       boolean not null default false,
  user_id    uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create index erp_notifications_user_id_idx on public.erp_notifications(user_id);
create index erp_notifications_read_idx    on public.erp_notifications(read);

-- ── Schedules (Operational Scheduler / Calendar) ──────────
create table public.erp_schedules (
  id          text primary key,
  title       text not null,
  description text,
  start_date  text not null,
  end_date    text,
  start_time  text,
  end_time    text,
  type        text not null default 'Event' check (type in ('Event','Task','Meeting','Deadline','Reminder')),
  priority    text not null default 'Normal' check (priority in ('Low','Normal','High','Critical')),
  assigned_to text,
  module      text,
  status      text not null default 'Scheduled' check (status in ('Scheduled','In Progress','Completed','Cancelled')),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger erp_schedules_updated_at before update on public.erp_schedules
  for each row execute procedure public.set_updated_at();

create index erp_schedules_start_date_idx on public.erp_schedules(start_date);

-- ── Sales Orders ──────────────────────────────────────────
create table public.erp_sales_orders (
  id           text primary key,
  customer     text not null,
  date         text not null,
  items        jsonb not null default '[]',
  total        numeric not null default 0 check (total >= 0),
  status       text not null default 'Pending' check (status in ('Pending','Approved','Invoiced','Delivered','Cancelled')),
  payment_type text not null default 'Full Payment' check (payment_type in ('Full Payment','Partial','Full Credit')),
  rep          text,
  notes        text,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create trigger erp_sales_orders_updated_at before update on public.erp_sales_orders
  for each row execute procedure public.set_updated_at();

create index erp_sales_orders_date_idx   on public.erp_sales_orders(date desc);
create index erp_sales_orders_status_idx on public.erp_sales_orders(status);

-- ── Purchase Orders ────────────────────────────────────────
create table public.erp_purchase_orders (
  id           text primary key,
  supplier     text not null,
  date         text not null,
  delivery     text,
  items        jsonb not null default '[]',
  total        numeric not null default 0 check (total >= 0),
  status       text not null default 'Pending Approval' check (status in ('Pending Approval','Approved','In Transit','Received','Cancelled')),
  buyer        text,
  notes        text,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create trigger erp_purchase_orders_updated_at before update on public.erp_purchase_orders
  for each row execute procedure public.set_updated_at();

create index erp_purchase_orders_date_idx   on public.erp_purchase_orders(date desc);
create index erp_purchase_orders_status_idx on public.erp_purchase_orders(status);

-- ── CRM Leads ──────────────────────────────────────────────
create table public.erp_leads (
  id           text primary key,
  name         text not null,
  contact      text,
  phone        text,
  email        text,
  stage        text not null default 'New' check (stage in ('New','Qualified','Proposal','Negotiation','Won','Lost')),
  value        numeric not null default 0 check (value >= 0),
  rep          text,
  last_contact text,
  notes        text,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create trigger erp_leads_updated_at before update on public.erp_leads
  for each row execute procedure public.set_updated_at();

create index erp_leads_stage_idx on public.erp_leads(stage);

-- ── Production Batches ─────────────────────────────────────
create table public.erp_production_batches (
  id          text primary key,
  product     text not null,
  recipe      text,
  line        text not null default 'Line A',
  planned_qty numeric not null default 0 check (planned_qty >= 0),
  actual_qty  numeric not null default 0 check (actual_qty >= 0),
  ingredients jsonb not null default '[]',
  started     text,
  completed   text,
  status      text not null default 'Scheduled' check (status in ('Scheduled','In Progress','Completed','Failed')),
  notes       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger erp_production_batches_updated_at before update on public.erp_production_batches
  for each row execute procedure public.set_updated_at();

create index erp_production_batches_status_idx on public.erp_production_batches(status);
create index erp_production_batches_date_idx   on public.erp_production_batches(created_at desc);

-- ── Row Level Security ─────────────────────────────────────
alter table public.profiles                enable row level security;
alter table public.erp_categories          enable row level security;
alter table public.erp_audit_log           enable row level security;
alter table public.erp_items               enable row level security;
alter table public.erp_clients       enable row level security;
alter table public.erp_suppliers     enable row level security;
alter table public.erp_creditors     enable row level security;
alter table public.erp_employees     enable row level security;
alter table public.erp_journal       enable row level security;
alter table public.erp_sales_orders        enable row level security;
alter table public.erp_purchase_orders    enable row level security;
alter table public.erp_leads              enable row level security;
alter table public.erp_production_batches enable row level security;
alter table public.erp_notifications      enable row level security;
alter table public.erp_schedules          enable row level security;

-- Profiles: authenticated users can read & write all
create policy "profiles_read_all"  on public.profiles for select using (auth.role() = 'authenticated');
create policy "profiles_write_all" on public.profiles for all    using (auth.role() = 'authenticated');

-- Categories: authenticated read; only admins write (enforced in app layer)
create policy "categories_read_all"  on public.erp_categories for select using (auth.role() = 'authenticated');
create policy "categories_write_all" on public.erp_categories for all    using (auth.role() = 'authenticated');

-- Audit log: insert by any authenticated user; read by any authenticated user
create policy "audit_read_all"   on public.erp_audit_log for select using (auth.role() = 'authenticated');
create policy "audit_insert_all" on public.erp_audit_log for insert with check (auth.role() = 'authenticated');

-- New business tables
create policy "sales_orders_all"    on public.erp_sales_orders      for all using (auth.role() = 'authenticated');
create policy "purchase_orders_all" on public.erp_purchase_orders   for all using (auth.role() = 'authenticated');
create policy "leads_all"           on public.erp_leads              for all using (auth.role() = 'authenticated');
create policy "prod_batches_all"    on public.erp_production_batches for all using (auth.role() = 'authenticated');

-- ERP tables: authenticated users full access (RBAC enforced at application layer)
create policy "items_all"      on public.erp_items      for all using (auth.role() = 'authenticated');
create policy "clients_all"    on public.erp_clients    for all using (auth.role() = 'authenticated');
create policy "suppliers_all"  on public.erp_suppliers  for all using (auth.role() = 'authenticated');
create policy "creditors_all"  on public.erp_creditors  for all using (auth.role() = 'authenticated');
create policy "employees_all"  on public.erp_employees  for all using (auth.role() = 'authenticated');
create policy "journal_all"    on public.erp_journal    for all using (auth.role() = 'authenticated');
create policy "schedules_all"  on public.erp_schedules  for all using (auth.role() = 'authenticated');

-- Notifications: users see and manage only their own
create policy "notifs_read_own"  on public.erp_notifications for select using (auth.uid() = user_id);
create policy "notifs_write_own" on public.erp_notifications for all    using (auth.uid() = user_id);

-- ── Enable Realtime ────────────────────────────────────────
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.erp_categories;
alter publication supabase_realtime add table public.erp_audit_log;
alter publication supabase_realtime add table public.erp_items;
alter publication supabase_realtime add table public.erp_clients;
alter publication supabase_realtime add table public.erp_suppliers;
alter publication supabase_realtime add table public.erp_creditors;
alter publication supabase_realtime add table public.erp_employees;
alter publication supabase_realtime add table public.erp_journal;
alter publication supabase_realtime add table public.erp_sales_orders;
alter publication supabase_realtime add table public.erp_purchase_orders;
alter publication supabase_realtime add table public.erp_leads;
alter publication supabase_realtime add table public.erp_production_batches;
alter publication supabase_realtime add table public.erp_notifications;
alter publication supabase_realtime add table public.erp_schedules;

-- ── Helpful view (non-sensitive user listing) ─────────────
create or replace view public.v_user_profiles as
  select
    p.id,
    p.username,
    p.full_name,
    p.role,
    p.phone,
    p.department,
    p.branch,
    p.employee_id,
    p.status,
    p.last_login,
    p.deleted_at,
    p.created_at
  from public.profiles p
  where p.deleted_at is null;

-- Repair: migrate existing profiles missing full_name
-- (run once manually if you have existing data)
-- update public.profiles set full_name = username where full_name = '';

-- ── REPLICA IDENTITY for Realtime (required for DELETE events) ─
alter table public.erp_items               replica identity full;
alter table public.erp_clients             replica identity full;
alter table public.erp_suppliers           replica identity full;
alter table public.erp_creditors           replica identity full;
alter table public.erp_employees           replica identity full;
alter table public.erp_journal             replica identity full;
alter table public.erp_sales_orders        replica identity full;
alter table public.erp_purchase_orders     replica identity full;
alter table public.erp_leads               replica identity full;
alter table public.erp_production_batches  replica identity full;
alter table public.profiles                replica identity full;

-- ════════════════════════════════════════════════════════════
-- CLEAN SLATE MIGRATION (v1.0.8)
-- Run this ONCE to wipe all demo/sample data and fix Super Admin.
-- ════════════════════════════════════════════════════════════
-- Step 1: Clear all business data (sample/demo data)
-- truncate table public.erp_items      cascade;
-- truncate table public.erp_clients    cascade;
-- truncate table public.erp_suppliers  cascade;
-- truncate table public.erp_creditors  cascade;
-- truncate table public.erp_employees  cascade;
-- truncate table public.erp_journal    cascade;
-- truncate table public.erp_sales_orders        cascade;
-- truncate table public.erp_purchase_orders     cascade;
-- truncate table public.erp_leads               cascade;
-- truncate table public.erp_production_batches  cascade;
-- truncate table public.erp_audit_log           cascade;
-- truncate table public.erp_notifications       cascade;
-- truncate table public.erp_schedules           cascade;

-- Step 2: Fix Super Admin profile — ensure correct role
-- (Replace 'your-super-admin-username' with the actual username)
-- update public.profiles
--   set role = 'Super Admin'
--   where username = 'your-super-admin-username';

-- Step 3: Delete all non-super-admin profiles (they can re-register)
-- delete from public.profiles where role != 'Super Admin';
-- (Then also delete corresponding auth.users via Supabase Dashboard → Auth → Users)

-- ════════════════════════════════════════════════════════════
-- POST-SETUP CHECKLIST:
-- 1. ✅ Run this SQL in Supabase Dashboard → SQL Editor
-- 2. Auth → Settings → Disable "Enable email confirmations"
-- 3. Auth → Settings → Set minimum password length to 8
-- 4. Add GitHub Secrets (repo Settings → Secrets → Actions):
--    VITE_SUPABASE_URL         = https://tzvlavmaaummnufibgkt.supabase.co
--    VITE_SUPABASE_ANON_KEY    = <your anon key>
--    KEYSTORE_BASE64           = <base64-encoded Android .jks keystore>
--    KEYSTORE_PASSWORD         = <keystore password>
--    KEYSTORE_ALIAS            = <key alias>
--    KEYSTORE_ALIAS_PASSWORD   = <alias password>
-- ════════════════════════════════════════════════════════════
