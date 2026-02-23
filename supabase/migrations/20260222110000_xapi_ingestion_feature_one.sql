-- Feature 1 foundation: xAPI ingestion + risk snapshot generation

ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS xapi_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS xapi_source_type TEXT,
ADD COLUMN IF NOT EXISTS xapi_endpoint TEXT,
ADD COLUMN IF NOT EXISTS xapi_client_id TEXT,
ADD COLUMN IF NOT EXISTS xapi_course_title TEXT,
ADD COLUMN IF NOT EXISTS xapi_confusion_threshold_pct NUMERIC(5,2) NOT NULL DEFAULT 25;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'modules_xapi_source_type_check'
  ) THEN
    ALTER TABLE public.modules
    ADD CONSTRAINT modules_xapi_source_type_check
    CHECK (xapi_source_type IS NULL OR xapi_source_type IN ('upload_zip', 'stream_endpoint'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.xapi_raw_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  actor_mbox TEXT,
  actor_name TEXT,
  verb_id TEXT,
  object_id TEXT,
  object_name TEXT,
  score_scaled NUMERIC,
  score_raw NUMERIC,
  success BOOLEAN,
  completion BOOLEAN,
  statement_timestamp TIMESTAMPTZ,
  region_tag TEXT,
  assigned_client_id TEXT,
  raw_statement JSONB NOT NULL,
  ingestion_batch_id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xapi_raw_module_time ON public.xapi_raw_statements(module_id, statement_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_xapi_raw_actor ON public.xapi_raw_statements(actor_mbox);
CREATE INDEX IF NOT EXISTS idx_xapi_raw_client ON public.xapi_raw_statements(assigned_client_id);

CREATE TABLE IF NOT EXISTS public.risk_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  snapshot_json JSONB NOT NULL,
  str_overall NUMERIC,
  objective_score_overall NUMERIC,
  engagement_rate_overall NUMERIC,
  dropoff_rate_pct NUMERIC,
  num_rows INTEGER NOT NULL DEFAULT 0,
  computed_from_start TIMESTAMPTZ,
  computed_from_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'finalized',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_snapshots_module_created ON public.risk_snapshots(module_id, created_at DESC);

ALTER TABLE public.xapi_raw_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage xapi_raw_statements" ON public.xapi_raw_statements;
CREATE POLICY "Admins can manage xapi_raw_statements"
ON public.xapi_raw_statements
FOR ALL
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Users can view xapi statements for assigned modules" ON public.xapi_raw_statements;
CREATE POLICY "Users can view xapi statements for assigned modules"
ON public.xapi_raw_statements
FOR SELECT
USING (
  is_admin_user(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.user_module_assignments uma
    WHERE uma.user_id = auth.uid() AND uma.module_id = xapi_raw_statements.module_id
  )
);

DROP POLICY IF EXISTS "Admins can manage risk_snapshots" ON public.risk_snapshots;
CREATE POLICY "Admins can manage risk_snapshots"
ON public.risk_snapshots
FOR ALL
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Users can view risk snapshots for assigned modules" ON public.risk_snapshots;
CREATE POLICY "Users can view risk snapshots for assigned modules"
ON public.risk_snapshots
FOR SELECT
USING (
  is_admin_user(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.user_module_assignments uma
    WHERE uma.user_id = auth.uid() AND uma.module_id = risk_snapshots.module_id
  )
);
