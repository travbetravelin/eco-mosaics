ALTER TABLE projects ADD COLUMN IF NOT EXISTS lat  numeric(9, 6);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS lng  numeric(9, 6);
