-- =====================================================
-- Fabegon ERP — Supabase Schema v1.0.37
-- Paste into Supabase → SQL Editor → Run All
-- Safe to re-run: handles existing tables of any prior version.
-- =====================================================

-- ─────────────────────────────────────────────────────
-- STEP 1: Convert any uuid primary keys to text
-- (older tables were created with id uuid — app uses text IDs like ITM-...)
-- ─────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='erp_items' AND column_name='id' AND data_type='uuid'
  ) THEN
    ALTER TABLE erp_items ALTER COLUMN id TYPE text USING id::text;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='erp_clients' AND column_name='id' AND data_type='uuid'
  ) THEN
    ALTER TABLE erp_clients ALTER COLUMN id TYPE text USING id::text;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='erp_suppliers' AND column_name='id' AND data_type='uuid'
  ) THEN
    ALTER TABLE erp_suppliers ALTER COLUMN id TYPE text USING id::text;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='erp_creditors' AND column_name='id' AND data_type='uuid'
  ) THEN
    ALTER TABLE erp_creditors ALTER COLUMN id TYPE text USING id::text;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='erp_employees' AND column_name='id' AND data_type='uuid'
  ) THEN
    ALTER TABLE erp_employees ALTER COLUMN id TYPE text USING id::text;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='erp_journal' AND column_name='id' AND data_type='uuid'
  ) THEN
    ALTER TABLE erp_journal ALTER COLUMN id TYPE text USING id::text;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='erp_sales_orders' AND column_name='id' AND data_type='uuid'
  ) THEN
    ALTER TABLE erp_sales_orders ALTER COLUMN id TYPE text USING id::text;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='erp_purchase_orders' AND column_name='id' AND data_type='uuid'
  ) THEN
    ALTER TABLE erp_purchase_orders ALTER COLUMN id TYPE text USING id::text;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='erp_leads' AND column_name='id' AND data_type='uuid'
  ) THEN
    ALTER TABLE erp_leads ALTER COLUMN id TYPE text USING id::text;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='erp_production_batches' AND column_name='id' AND data_type='uuid'
  ) THEN
    ALTER TABLE erp_production_batches ALTER COLUMN id TYPE text USING id::text;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='erp_schedule_events' AND column_name='id' AND data_type='uuid'
  ) THEN
    ALTER TABLE erp_schedule_events ALTER COLUMN id TYPE text USING id::text;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────
-- STEP 2: Drop any check constraints that conflict with app status values
-- ─────────────────────────────────────────────────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid='erp_creditors'::regclass AND contype='c' LOOP
    EXECUTE 'ALTER TABLE erp_creditors DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid='erp_items'::regclass AND contype='c' LOOP
    EXECUTE 'ALTER TABLE erp_items DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT conname FROM pg_constraint WHERE conrelid='erp_employees'::regclass AND contype='c' LOOP
    EXECUTE 'ALTER TABLE erp_employees DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────
-- STEP 3: Create tables (skips if already exist)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS erp_items (
  id              text        PRIMARY KEY,
  name            text        NOT NULL,
  sku             text                    DEFAULT NULL,
  category        text        NOT NULL    DEFAULT 'Raw Material',
  warehouse       text        NOT NULL    DEFAULT 'Main Store',
  qty             numeric     NOT NULL    DEFAULT 0,
  min_qty         numeric     NOT NULL    DEFAULT 0,
  max_qty         numeric     NOT NULL    DEFAULT 0,
  unit            text        NOT NULL    DEFAULT 'kg',
  cost            numeric     NOT NULL    DEFAULT 0,
  price           numeric     NOT NULL    DEFAULT 0,
  reorder         numeric     NOT NULL    DEFAULT 0,
  batch_number    text                    DEFAULT NULL,
  expiry          text                    DEFAULT NULL,
  supplier        text                    DEFAULT NULL,
  description     text                    DEFAULT NULL,
  status          text        NOT NULL    DEFAULT 'Available',
  approval_status text        NOT NULL    DEFAULT 'Approved',
  pending_change  text                    DEFAULT NULL,
  created_by      text                    DEFAULT NULL,
  updated_by      text                    DEFAULT NULL,
  created_at      timestamptz NOT NULL    DEFAULT now(),
  updated_at      timestamptz NOT NULL    DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_clients (
  id          text        PRIMARY KEY,
  name        text        NOT NULL,
  email       text                    DEFAULT NULL,
  phone       text                    DEFAULT NULL,
  company     text                    DEFAULT NULL,
  address     text                    DEFAULT NULL,
  notes       text                    DEFAULT NULL,
  credit_limit numeric                 DEFAULT 0,
  status      text        NOT NULL    DEFAULT 'Active',
  created_by  text                    DEFAULT NULL,
  updated_by  text                    DEFAULT NULL,
  created_at  timestamptz NOT NULL    DEFAULT now(),
  updated_at  timestamptz NOT NULL    DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_suppliers (
  id          text        PRIMARY KEY,
  name        text        NOT NULL,
  email       text                    DEFAULT NULL,
  phone       text                    DEFAULT NULL,
  company     text                    DEFAULT NULL,
  address     text                    DEFAULT NULL,
  notes       text                    DEFAULT NULL,
  status      text        NOT NULL    DEFAULT 'Active',
  created_by  text                    DEFAULT NULL,
  updated_by  text                    DEFAULT NULL,
  created_at  timestamptz NOT NULL    DEFAULT now(),
  updated_at  timestamptz NOT NULL    DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_creditors (
  id          text        PRIMARY KEY,
  name        text        NOT NULL,
  type        text        NOT NULL    DEFAULT 'other',
  amount      numeric     NOT NULL    DEFAULT 0,
  due_date    text                    DEFAULT NULL,
  status      text        NOT NULL    DEFAULT 'Outstanding',
  notes       text                    DEFAULT NULL,
  created_by  text                    DEFAULT NULL,
  updated_by  text                    DEFAULT NULL,
  created_at  timestamptz NOT NULL    DEFAULT now(),
  updated_at  timestamptz NOT NULL    DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_employees (
  id          text        PRIMARY KEY,
  name        text        NOT NULL,
  role        text                    DEFAULT NULL,
  department  text                    DEFAULT NULL,
  email       text                    DEFAULT NULL,
  phone       text                    DEFAULT NULL,
  salary      numeric                 DEFAULT 0,
  status      text        NOT NULL    DEFAULT 'Active',
  hire_date   text                    DEFAULT NULL,
  notes       text                    DEFAULT NULL,
  created_by  text                    DEFAULT NULL,
  updated_by  text                    DEFAULT NULL,
  created_at  timestamptz NOT NULL    DEFAULT now(),
  updated_at  timestamptz NOT NULL    DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_journal (
  id          text        PRIMARY KEY,
  date        text        NOT NULL    DEFAULT '',
  ref         text        NOT NULL    DEFAULT '',
  description text        NOT NULL    DEFAULT '',
  debit       numeric     NOT NULL    DEFAULT 0,
  credit      numeric     NOT NULL    DEFAULT 0,
  type        text        NOT NULL    DEFAULT 'adjustment',
  created_by  text                    DEFAULT NULL,
  created_at  timestamptz NOT NULL    DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_sales_orders (
  id              text        PRIMARY KEY,
  customer        text        NOT NULL    DEFAULT '',
  date            text        NOT NULL    DEFAULT '',
  status          text        NOT NULL    DEFAULT 'Pending',
  payment_type    text        NOT NULL    DEFAULT 'Cash',
  total           numeric     NOT NULL    DEFAULT 0,
  rep             text                    DEFAULT NULL,
  notes           text                    DEFAULT NULL,
  items           jsonb                   DEFAULT '[]',
  created_by      text                    DEFAULT NULL,
  updated_by      text                    DEFAULT NULL,
  created_at      timestamptz NOT NULL    DEFAULT now(),
  updated_at      timestamptz NOT NULL    DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_purchase_orders (
  id              text        PRIMARY KEY,
  supplier        text        NOT NULL    DEFAULT '',
  date            text        NOT NULL    DEFAULT '',
  status          text        NOT NULL    DEFAULT 'Pending',
  delivery        text                    DEFAULT NULL,
  total           numeric     NOT NULL    DEFAULT 0,
  buyer           text                    DEFAULT NULL,
  notes           text                    DEFAULT NULL,
  items           jsonb                   DEFAULT '[]',
  created_by      text                    DEFAULT NULL,
  updated_by      text                    DEFAULT NULL,
  created_at      timestamptz NOT NULL    DEFAULT now(),
  updated_at      timestamptz NOT NULL    DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_leads (
  id          text        PRIMARY KEY,
  name        text        NOT NULL,
  company     text                    DEFAULT NULL,
  email       text                    DEFAULT NULL,
  phone       text                    DEFAULT NULL,
  stage       text        NOT NULL    DEFAULT 'New',
  value       numeric                 DEFAULT 0,
  rep         text                    DEFAULT NULL,
  last_contact text                   DEFAULT NULL,
  notes       text                    DEFAULT NULL,
  created_by  text                    DEFAULT NULL,
  created_at  timestamptz NOT NULL    DEFAULT now(),
  updated_at  timestamptz NOT NULL    DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_production_batches (
  id              text        PRIMARY KEY,
  product         text        NOT NULL    DEFAULT '',
  recipe          text                    DEFAULT NULL,
  line            text                    DEFAULT NULL,
  planned_qty     numeric     NOT NULL    DEFAULT 0,
  actual_qty      numeric                 DEFAULT 0,
  ingredients     jsonb                   DEFAULT '[]',
  started         text                    DEFAULT NULL,
  completed       text                    DEFAULT NULL,
  status          text        NOT NULL    DEFAULT 'Planned',
  notes           text                    DEFAULT NULL,
  created_by      text                    DEFAULT NULL,
  created_at      timestamptz NOT NULL    DEFAULT now(),
  updated_at      timestamptz NOT NULL    DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_schedule_events (
  id          text        PRIMARY KEY,
  date        text        NOT NULL    DEFAULT '',
  title       text        NOT NULL    DEFAULT '',
  type        text        NOT NULL    DEFAULT 'other',
  time        text                    DEFAULT NULL,
  notes       text                    DEFAULT NULL,
  created_by  text                    DEFAULT NULL,
  created_at  timestamptz NOT NULL    DEFAULT now()
);

-- ─────────────────────────────────────────────────────
-- STEP 4: Add any missing columns to existing tables
-- ─────────────────────────────────────────────────────
ALTER TABLE erp_items ADD COLUMN IF NOT EXISTS created_by      text DEFAULT NULL;
ALTER TABLE erp_items ADD COLUMN IF NOT EXISTS updated_by      text DEFAULT NULL;
ALTER TABLE erp_items ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'Approved';
ALTER TABLE erp_items ADD COLUMN IF NOT EXISTS pending_change  text DEFAULT NULL;

ALTER TABLE erp_clients ADD COLUMN IF NOT EXISTS credit_limit  numeric DEFAULT 0;
ALTER TABLE erp_clients ADD COLUMN IF NOT EXISTS company       text DEFAULT NULL;
ALTER TABLE erp_clients ADD COLUMN IF NOT EXISTS notes         text DEFAULT NULL;
ALTER TABLE erp_clients ADD COLUMN IF NOT EXISTS created_by    text DEFAULT NULL;
ALTER TABLE erp_clients ADD COLUMN IF NOT EXISTS updated_by    text DEFAULT NULL;

ALTER TABLE erp_suppliers ADD COLUMN IF NOT EXISTS created_by  text DEFAULT NULL;
ALTER TABLE erp_suppliers ADD COLUMN IF NOT EXISTS updated_by  text DEFAULT NULL;

ALTER TABLE erp_creditors ADD COLUMN IF NOT EXISTS created_by  text DEFAULT NULL;
ALTER TABLE erp_creditors ADD COLUMN IF NOT EXISTS updated_by  text DEFAULT NULL;

ALTER TABLE erp_employees ADD COLUMN IF NOT EXISTS department   text DEFAULT NULL;
ALTER TABLE erp_employees ADD COLUMN IF NOT EXISTS hire_date    text DEFAULT NULL;
ALTER TABLE erp_employees ADD COLUMN IF NOT EXISTS salary       numeric DEFAULT 0;
ALTER TABLE erp_employees ADD COLUMN IF NOT EXISTS notes        text DEFAULT NULL;
ALTER TABLE erp_employees ADD COLUMN IF NOT EXISTS created_by   text DEFAULT NULL;
ALTER TABLE erp_employees ADD COLUMN IF NOT EXISTS updated_by   text DEFAULT NULL;

ALTER TABLE erp_journal ADD COLUMN IF NOT EXISTS created_by     text DEFAULT NULL;

ALTER TABLE erp_sales_orders ADD COLUMN IF NOT EXISTS rep        text DEFAULT NULL;
ALTER TABLE erp_sales_orders ADD COLUMN IF NOT EXISTS items      jsonb DEFAULT '[]';
ALTER TABLE erp_sales_orders ADD COLUMN IF NOT EXISTS created_by text DEFAULT NULL;
ALTER TABLE erp_sales_orders ADD COLUMN IF NOT EXISTS updated_by text DEFAULT NULL;

ALTER TABLE erp_purchase_orders ADD COLUMN IF NOT EXISTS delivery   text DEFAULT NULL;
ALTER TABLE erp_purchase_orders ADD COLUMN IF NOT EXISTS buyer      text DEFAULT NULL;
ALTER TABLE erp_purchase_orders ADD COLUMN IF NOT EXISTS items      jsonb DEFAULT '[]';
ALTER TABLE erp_purchase_orders ADD COLUMN IF NOT EXISTS created_by text DEFAULT NULL;
ALTER TABLE erp_purchase_orders ADD COLUMN IF NOT EXISTS updated_by text DEFAULT NULL;

ALTER TABLE erp_leads ADD COLUMN IF NOT EXISTS rep          text DEFAULT NULL;
ALTER TABLE erp_leads ADD COLUMN IF NOT EXISTS last_contact text DEFAULT NULL;
ALTER TABLE erp_leads ADD COLUMN IF NOT EXISTS created_by   text DEFAULT NULL;

ALTER TABLE erp_schedule_events ADD COLUMN IF NOT EXISTS created_by text DEFAULT NULL;

-- ─────────────────────────────────────────────────────
-- STEP 5: updated_at auto-trigger
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN CREATE TRIGGER trg_items_updated_at       BEFORE UPDATE ON erp_items             FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_clients_updated_at     BEFORE UPDATE ON erp_clients           FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_suppliers_updated_at   BEFORE UPDATE ON erp_suppliers         FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_creditors_updated_at   BEFORE UPDATE ON erp_creditors         FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_employees_updated_at   BEFORE UPDATE ON erp_employees         FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_sales_updated_at       BEFORE UPDATE ON erp_sales_orders      FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_purchases_updated_at   BEFORE UPDATE ON erp_purchase_orders   FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_leads_updated_at       BEFORE UPDATE ON erp_leads             FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_batches_updated_at     BEFORE UPDATE ON erp_production_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────
-- STEP 6: Row Level Security
-- ─────────────────────────────────────────────────────
ALTER TABLE erp_items              ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_suppliers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_creditors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_employees          ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_journal            ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_sales_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_purchase_orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_leads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_schedule_events    ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text;
BEGIN FOR t IN SELECT unnest(ARRAY[
  'erp_items','erp_clients','erp_suppliers','erp_creditors','erp_employees',
  'erp_journal','erp_sales_orders','erp_purchase_orders','erp_leads',
  'erp_production_batches','erp_schedule_events'
]) LOOP
  EXECUTE format('DROP POLICY IF EXISTS allow_auth_all ON %I', t);
END LOOP; END $$;

CREATE POLICY allow_auth_all ON erp_items              FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_auth_all ON erp_clients            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_auth_all ON erp_suppliers          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_auth_all ON erp_creditors          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_auth_all ON erp_employees          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_auth_all ON erp_journal            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_auth_all ON erp_sales_orders       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_auth_all ON erp_purchase_orders    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_auth_all ON erp_leads              FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_auth_all ON erp_production_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_auth_all ON erp_schedule_events    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────
-- STEP 6b: Performance indexes (skip if already exist)
-- ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_items_status        ON erp_items(status);
CREATE INDEX IF NOT EXISTS idx_items_category      ON erp_items(category);
CREATE INDEX IF NOT EXISTS idx_items_warehouse     ON erp_items(warehouse);
CREATE INDEX IF NOT EXISTS idx_items_created_at    ON erp_items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_journal_date        ON erp_journal(date);
CREATE INDEX IF NOT EXISTS idx_journal_type        ON erp_journal(type);
CREATE INDEX IF NOT EXISTS idx_journal_created_at  ON erp_journal(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_creditors_status    ON erp_creditors(status);
CREATE INDEX IF NOT EXISTS idx_creditors_due_date  ON erp_creditors(due_date);

CREATE INDEX IF NOT EXISTS idx_schedule_date       ON erp_schedule_events(date);
CREATE INDEX IF NOT EXISTS idx_schedule_type       ON erp_schedule_events(type);

CREATE INDEX IF NOT EXISTS idx_sales_date          ON erp_sales_orders(date);
CREATE INDEX IF NOT EXISTS idx_sales_status        ON erp_sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at    ON erp_sales_orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchases_date      ON erp_purchase_orders(date);
CREATE INDEX IF NOT EXISTS idx_purchases_status    ON erp_purchase_orders(status);

CREATE INDEX IF NOT EXISTS idx_leads_stage         ON erp_leads(stage);
CREATE INDEX IF NOT EXISTS idx_batches_status      ON erp_production_batches(status);

-- ─────────────────────────────────────────────────────
-- STEP 7: Realtime
-- ─────────────────────────────────────────────────────
DO $$ DECLARE t text;
BEGIN FOR t IN SELECT unnest(ARRAY[
  'erp_items','erp_clients','erp_suppliers','erp_creditors','erp_employees',
  'erp_journal','erp_sales_orders','erp_purchase_orders','erp_leads',
  'erp_production_batches','erp_schedule_events'
]) LOOP
  BEGIN
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END LOOP; END $$;

-- =====================================================
-- Done. Run this in Supabase → SQL Editor → Run All
-- =====================================================
