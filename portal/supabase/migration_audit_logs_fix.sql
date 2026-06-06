-- Fix: make audit trigger robust so it never blocks the operation it's auditing.
-- Wraps the INSERT in an EXCEPTION block so any failure (RLS, missing table,
-- constraint) is swallowed rather than rolling back the parent transaction.
-- Also adds a belt-and-suspenders INSERT policy on audit_logs.

DROP POLICY IF EXISTS "audit_logs_trigger_insert" ON audit_logs;
CREATE POLICY "audit_logs_trigger_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  BEGIN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data)
    VALUES (
      TG_TABLE_NAME,
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
      TG_OP,
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
  EXCEPTION WHEN OTHERS THEN
    NULL; -- never let audit failures block the triggering operation
  END;
  RETURN COALESCE(NEW, OLD);
END;
$$;
