-- xAPI completion tracking migration
-- Adds: completion threshold tracking & alert logging per module

-- 1. Add completion_threshold column to modules
--    Default 40 completions before dashboard-update email is sent
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS completion_threshold integer NOT NULL DEFAULT 40;

-- 2. Add alert_sent_at to track when the threshold email was last fired
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS completion_alert_sent_at timestamptz;

-- 3. Add xapi_data column to store the full parsed Risk Intelligence JSON
--    (separate from kpis so legacy fields are untouched)
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS xapi_data jsonb;

-- 4. Mark existing user_module_assignments completion_alert_fired column
--    so we can idempotently check whether the alert already went out
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS completion_alert_fired boolean NOT NULL DEFAULT false;

-- 5. RLS policy: allow admins to update the new columns
-- (existing RLS already covers the modules table via is_admin_user())
