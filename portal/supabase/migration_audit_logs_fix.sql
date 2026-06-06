-- Fix: allow audit trigger inserts into audit_logs when RLS is enabled.
-- SECURITY DEFINER functions owned by postgres should bypass RLS automatically,
-- but some Supabase configurations require an explicit INSERT policy.
-- This permissive INSERT policy is safe: audit_logs has no UPDATE/DELETE
-- policies (append-only), and clients have no application path to write here.

DROP POLICY IF EXISTS "audit_logs_trigger_insert" ON audit_logs;
CREATE POLICY "audit_logs_trigger_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);
