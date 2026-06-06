-- Snapshot the employee's job_role onto each time entry at insert time.
-- This preserves the role they held when the work was recorded, so promotions
-- don't retroactively change how historical hours are grouped.

ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS job_role text;

-- Trigger function: copies job_role from profiles before each insert
CREATE OR REPLACE FUNCTION snapshot_employee_job_role()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  SELECT job_role INTO NEW.job_role
  FROM profiles
  WHERE id = NEW.employee_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER time_entries_snapshot_job_role
  BEFORE INSERT ON time_entries
  FOR EACH ROW EXECUTE FUNCTION snapshot_employee_job_role();

-- Backfill existing entries using current profile job_role.
-- NOTE: This is the best approximation available for historical rows —
-- it reflects today's role, not the role at the time of entry.
UPDATE time_entries te
SET job_role = p.job_role
FROM profiles p
WHERE te.employee_id = p.id
  AND te.job_role IS NULL;
