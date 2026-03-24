-- H.A.S. operational recovery (non-destructive)
-- Date: 2026-03-04

BEGIN;

-- 1) Ensure users are linked to some salon (legacy null tenant issue)
WITH first_salon AS (
  SELECT id
  FROM salons
  ORDER BY name ASC
  LIMIT 1
)
UPDATE users u
SET "salonId" = fs.id
FROM first_salon fs
WHERE u."salonId" IS NULL;

-- 2) Ensure analysis_history has safe defaults for legacy rows
UPDATE analysis_history
SET "domain" = COALESCE("domain", 'capilar')
WHERE "domain" IS NULL;

UPDATE analysis_history
SET "baseResult" = COALESCE("baseResult", '{}'::jsonb)
WHERE "baseResult" IS NULL;

UPDATE analysis_history
SET "ragResult" = COALESCE("ragResult", '{}'::jsonb)
WHERE "ragResult" IS NULL;

COMMIT;
