-- Remove the module_adaptations table as it's no longer needed
-- This table was only used by the New Adaptation Lynqs feature which is being removed
DROP TABLE IF EXISTS public.module_adaptations;