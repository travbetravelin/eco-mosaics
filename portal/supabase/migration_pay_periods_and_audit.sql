-- ── Pay Periods ─────────────────────────────────────────────────────────
-- Records closed 2-week payroll periods derived from base date 2025-01-01.
-- Open periods have no row here. A row with closed_at set = locked for employees.

CREATE TABLE IF NOT EXISTS pay_periods (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date  date        NOT NULL UNIQUE,
  end_date    date        NOT NULL,
  closed_at   timestamptz,
  closed_by   uuid        REFERENCES profiles(id),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pay_periods_start_idx ON pay_periods(start_date);

ALTER TABLE pay_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pay_periods_read" ON pay_periods
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "pay_periods_admin_write" ON pay_periods
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ── Audit Logs ───────────────────────────────────────────────────────────
-- Append-only log of every insert/update/delete on key tables.
-- Only triggers write here — no direct user insert policy.

CREATE TABLE IF NOT EXISTS audit_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   text        NOT NULL,
  record_id    uuid,
  action       text        NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data     jsonb,
  new_data     jsonb,
  performed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_table_record_idx ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS audit_logs_performed_at_idx ON audit_logs(performed_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_admin_read" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ── Audit trigger function ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;


-- ── Attach triggers ──────────────────────────────────────────────────────

CREATE OR REPLACE TRIGGER time_entries_audit
  AFTER INSERT OR UPDATE OR DELETE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE OR REPLACE TRIGGER profiles_audit
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE OR REPLACE TRIGGER projects_audit
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE OR REPLACE TRIGGER pay_periods_audit
  AFTER INSERT OR UPDATE OR DELETE ON pay_periods
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
