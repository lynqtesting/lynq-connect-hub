-- Phase 1: Configure Realtime Publication & Remove Conflicting Triggers

-- Add modules table to realtime publication for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.modules;

-- Set REPLICA IDENTITY FULL to ensure complete row data during updates
ALTER TABLE public.modules REPLICA IDENTITY FULL;

-- Remove the conflicting version increment trigger that interferes with updates
DROP TRIGGER IF EXISTS increment_version_trigger ON public.modules;

-- Add performance indexes for realtime queries
CREATE INDEX IF NOT EXISTS idx_modules_updated_at ON public.modules(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_modules_id_updated_at ON public.modules(id, updated_at);

-- Add composite index for user module assignments lookups
CREATE INDEX IF NOT EXISTS idx_user_module_assignments_lookup 
ON user_module_assignments(user_id, module_id, assigned_at DESC);