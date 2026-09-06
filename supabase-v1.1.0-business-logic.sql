-- =====================================================
-- Fabegon ERP — Business Logic Layer v1.1.0
-- Run AFTER supabase-schema.sql (which creates core tables)
-- Paste into Supabase → SQL Editor → Run All
-- Safe to re-run: idempotent throughout.
-- =====================================================

SET search_path TO public;

-- ─────────────────────────────────────────────────────
-- PART 1: Business Support Tables
-- ─────────────────────────────────────────────────────

-- NOTE: column is named "entity" (not "table_name") to avoid
-- conflict with information_schema reserved column names.
CREATE TABLE IF NOT EXISTS erp_audit_log (
  id          bigserial   PRIMARY KEY,
  entity      text        NOT NULL,        -- e.g. erp_items, erp_sales_orders
  record_id   text        NOT NULL,
  action      text        NOT NULL,        -- INSERT, UPDATE, DELETE
  old_data    jsonb                        DEFAULT NULL,
  new_data    jsonb                        DEFAULT NULL,
  changed_by  text                         DEFAULT NULL,
  changed_at  timestamptz NOT NULL         DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity   ON erp_audit_log(entity);
CREATE INDEX IF NOT EXISTS idx_audit_record   ON erp_audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed  ON erp_audit_log(changed_at DESC);

CREATE TABLE IF NOT EXISTS erp_stock_movements (
  id          bigserial   PRIMARY KEY,
  item_id     text        NOT NULL,
  item_name   text        NOT NULL,
  warehouse   text                         DEFAULT NULL,
  movement    text        NOT NULL,        -- IN, OUT, ADJUST, TRANSFER
  qty_before  numeric     NOT NULL         DEFAULT 0,
  qty_change  numeric     NOT NULL         DEFAULT 0,
  qty_after   numeric     NOT NULL         DEFAULT 0,
  unit        text                         DEFAULT NULL,
  source      text                         DEFAULT NULL,
  notes       text                         DEFAULT NULL,
  created_by  text                         DEFAULT NULL,
  created_at  timestamptz NOT NULL         DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_item     ON erp_stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_created  ON erp_stock_movements(created_at DESC);

CREATE TABLE IF NOT EXISTS erp_account_transactions (
  id           bigserial   PRIMARY KEY,
  journal_id   text                         DEFAULT NULL,
  account      text        NOT NULL,
  entry_type   text        NOT NULL,        -- DEBIT, CREDIT
  amount       numeric     NOT NULL         DEFAULT 0,
  description  text                         DEFAULT NULL,
  src_entity   text                         DEFAULT NULL,
  src_id       text                         DEFAULT NULL,
  created_at   timestamptz NOT NULL         DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_acct_txn_journal ON erp_account_transactions(journal_id);
CREATE INDEX IF NOT EXISTS idx_acct_txn_account ON erp_account_transactions(account);

CREATE TABLE IF NOT EXISTS erp_document_numbers (
  prefix      text        PRIMARY KEY,
  last_seq    integer     NOT NULL         DEFAULT 0,
  updated_at  timestamptz NOT NULL         DEFAULT now()
);

INSERT INTO erp_document_numbers(prefix, last_seq) VALUES
  ('JE', 0), ('SO', 0), ('PO', 0), ('CR', 0), ('ITM', 0), ('BATCH', 0)
ON CONFLICT (prefix) DO NOTHING;

CREATE TABLE IF NOT EXISTS erp_notifications (
  id          bigserial   PRIMARY KEY,
  user_id     text                         DEFAULT NULL,
  title       text        NOT NULL,
  body        text                         DEFAULT NULL,
  module      text                         DEFAULT NULL,
  notif_type  text        NOT NULL         DEFAULT 'info',
  is_read     boolean     NOT NULL         DEFAULT false,
  created_at  timestamptz NOT NULL         DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_user    ON erp_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_created ON erp_notifications(created_at DESC);

CREATE TABLE IF NOT EXISTS erp_approval_queue (
  id           bigserial   PRIMARY KEY,
  entity       text        NOT NULL,
  record_id    text        NOT NULL,
  action       text        NOT NULL,
  payload      jsonb       NOT NULL         DEFAULT '{}',
  status       text        NOT NULL         DEFAULT 'Pending',
  submitted_by text                         DEFAULT NULL,
  reviewed_by  text                         DEFAULT NULL,
  comments     text                         DEFAULT NULL,
  submitted_at timestamptz NOT NULL         DEFAULT now(),
  reviewed_at  timestamptz                  DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_approval_status ON erp_approval_queue(status);
CREATE INDEX IF NOT EXISTS idx_approval_entity ON erp_approval_queue(entity, record_id);

CREATE TABLE IF NOT EXISTS erp_sync_queue (
  id          bigserial   PRIMARY KEY,
  entity      text        NOT NULL,
  record_id   text        NOT NULL,
  operation   text        NOT NULL,
  payload     jsonb       NOT NULL         DEFAULT '{}',
  retries     integer     NOT NULL         DEFAULT 0,
  last_error  text                         DEFAULT NULL,
  created_at  timestamptz NOT NULL         DEFAULT now(),
  synced_at   timestamptz                  DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_sync_pending ON erp_sync_queue(synced_at) WHERE synced_at IS NULL;

-- ─────────────────────────────────────────────────────
-- PART 2: RLS for new tables
-- ─────────────────────────────────────────────────────

ALTER TABLE erp_audit_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_stock_movements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_account_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_document_numbers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_approval_queue       ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_sync_queue           ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text;
BEGIN FOR t IN SELECT unnest(ARRAY[
  'erp_audit_log','erp_stock_movements','erp_account_transactions',
  'erp_document_numbers','erp_notifications','erp_approval_queue','erp_sync_queue'
]) LOOP
  EXECUTE format('DROP POLICY IF EXISTS allow_auth_all ON %I', t);
  EXECUTE format('CREATE POLICY allow_auth_all ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
END LOOP; END $$;

-- ─────────────────────────────────────────────────────
-- PART 3: Shared Helper Functions
-- ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION erp_generate_document_number(p_prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_seq integer;
BEGIN
  INSERT INTO erp_document_numbers(prefix, last_seq)
    VALUES (p_prefix, 1)
  ON CONFLICT (prefix)
    DO UPDATE SET last_seq = erp_document_numbers.last_seq + 1,
                  updated_at = now()
  RETURNING last_seq INTO v_seq;
  RETURN p_prefix || '-' || lpad(v_seq::text, 4, '0');
END $$;

CREATE OR REPLACE FUNCTION erp_write_audit(
  p_entity  text,
  p_id      text,
  p_action  text,
  p_old     jsonb DEFAULT NULL,
  p_new     jsonb DEFAULT NULL,
  p_by      text  DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO erp_audit_log(entity, record_id, action, old_data, new_data, changed_by)
  VALUES (p_entity, p_id, p_action, p_old, p_new, p_by);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION erp_create_journal(
  p_ref         text,
  p_date        text,
  p_description text,
  p_debit       numeric,
  p_credit      numeric,
  p_type        text DEFAULT 'adjustment',
  p_by          text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id text;
BEGIN
  v_id := 'JE-DB-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 4));
  INSERT INTO erp_journal(id, date, ref, description, debit, credit, type, created_by, created_at)
  VALUES (v_id, p_date, p_ref, p_description, p_debit, p_credit, p_type, p_by, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN v_id;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION erp_create_scheduler_event(
  p_ref   text,
  p_title text,
  p_type  text DEFAULT 'other',
  p_notes text DEFAULT NULL,
  p_by    text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id text;
BEGIN
  v_id := 'SCHE-DB-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(p_ref || random()::text), 1, 6));
  INSERT INTO erp_schedule_events(id, date, title, type, notes, created_by, created_at)
  VALUES (v_id, current_date::text, p_title, p_type, p_notes, p_by, now())
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION erp_record_stock_movement(
  p_item_id    text,
  p_item_name  text,
  p_warehouse  text,
  p_movement   text,
  p_qty_before numeric,
  p_qty_change numeric,
  p_qty_after  numeric,
  p_unit       text    DEFAULT NULL,
  p_source     text    DEFAULT NULL,
  p_notes      text    DEFAULT NULL,
  p_by         text    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO erp_stock_movements(
    item_id, item_name, warehouse, movement,
    qty_before, qty_change, qty_after,
    unit, source, notes, created_by
  )
  VALUES (
    p_item_id, p_item_name, p_warehouse, p_movement,
    p_qty_before, p_qty_change, p_qty_after,
    p_unit, p_source, p_notes, p_by
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────
-- PART 4: Business Trigger Functions
-- ─────────────────────────────────────────────────────

-- 4a: erp_items
CREATE OR REPLACE FUNCTION trg_fn_items_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qty_change numeric;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM erp_write_audit('erp_items', NEW.id, 'INSERT', NULL, to_jsonb(NEW));
    IF COALESCE(NEW.qty, 0) > 0 THEN
      PERFORM erp_record_stock_movement(
        NEW.id, NEW.name, COALESCE(NEW.warehouse, 'Main Store'),
        'IN', 0, COALESCE(NEW.qty, 0), COALESCE(NEW.qty, 0),
        NEW.unit, 'ITEM-CREATE', 'New item added'
      );
    END IF;
    PERFORM erp_create_journal(
      'ITM-' || NEW.id,
      current_date::text,
      'Inventory — ' || NEW.name || ' added to ' || COALESCE(NEW.warehouse, 'store')
        || ' (' || COALESCE(NEW.qty, 0)::text || ' ' || COALESCE(NEW.unit, 'units') || ')',
      COALESCE(NEW.qty, 0) * COALESCE(NEW.cost, 0),
      0,
      'adjustment'
    );
    PERFORM erp_create_scheduler_event(
      NEW.id,
      '[Inventory] Item added: ' || NEW.name || ' — '
        || COALESCE(NEW.qty, 0)::text || ' ' || COALESCE(NEW.unit, 'units')
        || ' · ' || COALESCE(NEW.warehouse, 'store'),
      'other'
    );

  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM erp_write_audit('erp_items', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    IF COALESCE(OLD.qty, 0) IS DISTINCT FROM COALESCE(NEW.qty, 0) THEN
      v_qty_change := COALESCE(NEW.qty, 0) - COALESCE(OLD.qty, 0);
      PERFORM erp_record_stock_movement(
        NEW.id, NEW.name, COALESCE(NEW.warehouse, 'Main Store'),
        CASE WHEN v_qty_change >= 0 THEN 'IN' ELSE 'OUT' END,
        COALESCE(OLD.qty, 0),
        v_qty_change,
        COALESCE(NEW.qty, 0),
        NEW.unit, 'ADJUST', 'Quantity updated'
      );
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    PERFORM erp_write_audit('erp_items', OLD.id, 'DELETE', to_jsonb(OLD), NULL);
  END IF;

  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_items_logic ON erp_items;
CREATE TRIGGER trg_items_logic
  AFTER INSERT OR UPDATE OR DELETE ON erp_items
  FOR EACH ROW EXECUTE FUNCTION trg_fn_items_logic();

-- 4b: erp_sales_orders
CREATE OR REPLACE FUNCTION trg_fn_sales_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM erp_write_audit('erp_sales_orders', NEW.id, 'INSERT', NULL, to_jsonb(NEW));
    PERFORM erp_create_journal(
      NEW.id,
      COALESCE(NEW.date, current_date::text),
      'Sales Order — ' || COALESCE(NEW.customer, 'Unknown') || ' · TZS ' || COALESCE(NEW.total, 0)::text,
      CASE WHEN COALESCE(NEW.payment_type, '') IN ('Full Credit','Partial') THEN COALESCE(NEW.total, 0) ELSE 0 END,
      COALESCE(NEW.total, 0),
      'sales'
    );
    PERFORM erp_create_scheduler_event(
      NEW.id,
      '[Sales] Order ' || NEW.id || ' — ' || COALESCE(NEW.customer, 'Unknown')
        || ' · TZS ' || COALESCE(NEW.total, 0)::text,
      'sales',
      'ref:' || NEW.id
    );

  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM erp_write_audit('erp_sales_orders', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    IF COALESCE(OLD.status, '') IS DISTINCT FROM COALESCE(NEW.status, '')
       AND NEW.status IN ('Approved', 'Delivered') THEN
      PERFORM erp_create_journal(
        NEW.id || '-COGS',
        COALESCE(NEW.date, current_date::text),
        'COGS — ' || COALESCE(NEW.customer, 'Unknown') || ' · ' || NEW.id,
        round(COALESCE(NEW.total, 0) * 0.6, 2),
        0,
        'adjustment'
      );
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    PERFORM erp_write_audit('erp_sales_orders', OLD.id, 'DELETE', to_jsonb(OLD), NULL);
  END IF;

  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_sales_logic ON erp_sales_orders;
CREATE TRIGGER trg_sales_logic
  AFTER INSERT OR UPDATE OR DELETE ON erp_sales_orders
  FOR EACH ROW EXECUTE FUNCTION trg_fn_sales_logic();

-- 4c: erp_purchase_orders
CREATE OR REPLACE FUNCTION trg_fn_purchases_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM erp_write_audit('erp_purchase_orders', NEW.id, 'INSERT', NULL, to_jsonb(NEW));
    PERFORM erp_create_journal(
      NEW.id,
      COALESCE(NEW.date, current_date::text),
      'Purchase Order — ' || COALESCE(NEW.supplier, 'Unknown') || ' · TZS ' || COALESCE(NEW.total, 0)::text,
      COALESCE(NEW.total, 0),
      0,
      'purchase'
    );
    PERFORM erp_create_scheduler_event(
      NEW.id,
      '[Procurement] PO ' || NEW.id || ' — ' || COALESCE(NEW.supplier, 'Unknown')
        || ' · TZS ' || COALESCE(NEW.total, 0)::text,
      'procurement',
      'ref:' || NEW.id
    );

  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM erp_write_audit('erp_purchase_orders', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    IF COALESCE(OLD.status, '') IS DISTINCT FROM COALESCE(NEW.status, '')
       AND NEW.status = 'Approved' THEN
      INSERT INTO erp_creditors(id, name, type, amount, due_date, status, notes, created_at)
      VALUES (
        'CR-PO-' || NEW.id,
        COALESCE(NEW.supplier, 'Unknown Supplier'),
        'supplier',
        COALESCE(NEW.total, 0),
        (current_date + interval '30 days')::text,
        'Outstanding',
        'Auto — Purchase Order ' || NEW.id,
        now()
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    PERFORM erp_write_audit('erp_purchase_orders', OLD.id, 'DELETE', to_jsonb(OLD), NULL);
  END IF;

  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_purchases_logic ON erp_purchase_orders;
CREATE TRIGGER trg_purchases_logic
  AFTER INSERT OR UPDATE OR DELETE ON erp_purchase_orders
  FOR EACH ROW EXECUTE FUNCTION trg_fn_purchases_logic();

-- 4d: erp_production_batches
CREATE OR REPLACE FUNCTION trg_fn_batches_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_qty numeric;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM erp_write_audit('erp_production_batches', NEW.id, 'INSERT', NULL, to_jsonb(NEW));
    PERFORM erp_create_journal(
      NEW.id,
      COALESCE(left(COALESCE(NEW.started, ''), 10), current_date::text),
      'Production Batch Started — ' || NEW.id || ' · ' || COALESCE(NEW.product, 'Unknown')
        || ' (' || COALESCE(NEW.planned_qty, 0)::text || ' units planned)',
      0, 0, 'adjustment'
    );
    PERFORM erp_create_scheduler_event(
      NEW.id,
      '[Production] Batch ' || NEW.id || ' — ' || COALESCE(NEW.product, 'Unknown')
        || ' (' || COALESCE(NEW.planned_qty, 0)::text || ' units planned)',
      'production',
      'ref:' || NEW.id
    );

  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM erp_write_audit('erp_production_batches', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    IF COALESCE(OLD.status, '') IS DISTINCT FROM COALESCE(NEW.status, '')
       AND NEW.status = 'Completed' THEN
      v_qty := CASE WHEN COALESCE(NEW.actual_qty, 0) > 0 THEN NEW.actual_qty ELSE NEW.planned_qty END;
      PERFORM erp_create_journal(
        NEW.id || '-COMP',
        current_date::text,
        'Production Completed — ' || NEW.id || ' · ' || COALESCE(NEW.product, 'Unknown')
          || ' (' || COALESCE(v_qty, 0)::text || ' units produced)',
        0, 0, 'adjustment'
      );
      PERFORM erp_create_scheduler_event(
        NEW.id || '-COMP',
        '[Production] Batch Completed: ' || NEW.id || ' — ' || COALESCE(NEW.product, 'Unknown')
          || ' (' || COALESCE(v_qty, 0)::text || ' units)',
        'production',
        'ref:' || NEW.id
      );
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    PERFORM erp_write_audit('erp_production_batches', OLD.id, 'DELETE', to_jsonb(OLD), NULL);
  END IF;

  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_batches_logic ON erp_production_batches;
CREATE TRIGGER trg_batches_logic
  AFTER INSERT OR UPDATE OR DELETE ON erp_production_batches
  FOR EACH ROW EXECUTE FUNCTION trg_fn_batches_logic();

-- 4e: erp_creditors
CREATE OR REPLACE FUNCTION trg_fn_creditors_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF    TG_OP = 'INSERT' THEN PERFORM erp_write_audit('erp_creditors', NEW.id, 'INSERT', NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN PERFORM erp_write_audit('erp_creditors', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN PERFORM erp_write_audit('erp_creditors', OLD.id, 'DELETE', to_jsonb(OLD), NULL);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_creditors_logic ON erp_creditors;
CREATE TRIGGER trg_creditors_logic
  AFTER INSERT OR UPDATE OR DELETE ON erp_creditors
  FOR EACH ROW EXECUTE FUNCTION trg_fn_creditors_logic();

-- 4f: erp_journal
CREATE OR REPLACE FUNCTION trg_fn_journal_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM erp_write_audit('erp_journal', NEW.id, 'INSERT', NULL, to_jsonb(NEW));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_journal_audit ON erp_journal;
CREATE TRIGGER trg_journal_audit
  AFTER INSERT ON erp_journal
  FOR EACH ROW EXECUTE FUNCTION trg_fn_journal_audit();

-- 4g: erp_employees
CREATE OR REPLACE FUNCTION trg_fn_employees_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM erp_write_audit('erp_employees', NEW.id, 'INSERT', NULL, to_jsonb(NEW));
    PERFORM erp_create_scheduler_event(
      NEW.id,
      '[HR] Employee onboarded: ' || NEW.name || ' — ' || COALESCE(NEW.role, 'Role TBD'),
      'hr',
      'ref:' || NEW.id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM erp_write_audit('erp_employees', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM erp_write_audit('erp_employees', OLD.id, 'DELETE', to_jsonb(OLD), NULL);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_employees_logic ON erp_employees;
CREATE TRIGGER trg_employees_logic
  AFTER INSERT OR UPDATE OR DELETE ON erp_employees
  FOR EACH ROW EXECUTE FUNCTION trg_fn_employees_logic();

-- 4h: erp_clients
CREATE OR REPLACE FUNCTION trg_fn_clients_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF    TG_OP = 'INSERT' THEN PERFORM erp_write_audit('erp_clients', NEW.id, 'INSERT', NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN PERFORM erp_write_audit('erp_clients', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN PERFORM erp_write_audit('erp_clients', OLD.id, 'DELETE', to_jsonb(OLD), NULL);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_clients_logic ON erp_clients;
CREATE TRIGGER trg_clients_logic
  AFTER INSERT OR UPDATE OR DELETE ON erp_clients
  FOR EACH ROW EXECUTE FUNCTION trg_fn_clients_logic();

-- 4i: erp_suppliers
CREATE OR REPLACE FUNCTION trg_fn_suppliers_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF    TG_OP = 'INSERT' THEN PERFORM erp_write_audit('erp_suppliers', NEW.id, 'INSERT', NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN PERFORM erp_write_audit('erp_suppliers', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN PERFORM erp_write_audit('erp_suppliers', OLD.id, 'DELETE', to_jsonb(OLD), NULL);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_suppliers_logic ON erp_suppliers;
CREATE TRIGGER trg_suppliers_logic
  AFTER INSERT OR UPDATE OR DELETE ON erp_suppliers
  FOR EACH ROW EXECUTE FUNCTION trg_fn_suppliers_logic();

-- 4j: erp_leads
CREATE OR REPLACE FUNCTION trg_fn_leads_logic()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF    TG_OP = 'INSERT' THEN PERFORM erp_write_audit('erp_leads', NEW.id, 'INSERT', NULL, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN PERFORM erp_write_audit('erp_leads', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN PERFORM erp_write_audit('erp_leads', OLD.id, 'DELETE', to_jsonb(OLD), NULL);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_leads_logic ON erp_leads;
CREATE TRIGGER trg_leads_logic
  AFTER INSERT OR UPDATE OR DELETE ON erp_leads
  FOR EACH ROW EXECUTE FUNCTION trg_fn_leads_logic();

-- ─────────────────────────────────────────────────────
-- PART 5: Realtime
-- ─────────────────────────────────────────────────────
DO $$ DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'erp_audit_log','erp_stock_movements','erp_account_transactions',
    'erp_notifications','erp_approval_queue'
  ]) LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────
-- PART 6: Extra indexes
-- ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_stock_mv_warehouse ON erp_stock_movements(warehouse);
CREATE INDEX IF NOT EXISTS idx_stock_mv_movement  ON erp_stock_movements(movement);
CREATE INDEX IF NOT EXISTS idx_notif_unread       ON erp_notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_approval_submitted ON erp_approval_queue(submitted_at DESC);

-- =====================================================
-- Done. Run supabase-schema.sql first, then this file.
-- =====================================================
