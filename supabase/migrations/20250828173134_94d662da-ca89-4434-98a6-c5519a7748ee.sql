-- Phase 1: Configure Database for Reliable Realtime (Skip already configured items)

-- Set REPLICA IDENTITY FULL to ensure complete row data during updates (if not already set)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND c.relname = 'modules' 
        AND c.relreplident = 'f'
    ) THEN
        ALTER TABLE public.modules REPLICA IDENTITY FULL;
    END IF;
END $$;

-- Remove the conflicting version increment trigger that interferes with updates
DROP TRIGGER IF EXISTS increment_version_trigger ON public.modules;

-- Add performance indexes for realtime queries
CREATE INDEX IF NOT EXISTS idx_modules_updated_at ON public.modules(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_modules_id_updated_at ON public.modules(id, updated_at);

-- Add composite index for user module assignments lookups
CREATE INDEX IF NOT EXISTS idx_user_module_assignments_lookup 
ON user_module_assignments(user_id, module_id, assigned_at DESC);