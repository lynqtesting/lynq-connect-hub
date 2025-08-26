-- Add unique constraint for user_module_assignments to enable proper upsert functionality
-- This prevents duplicate assignments and enables the upsert operation to work correctly

ALTER TABLE public.user_module_assignments 
ADD CONSTRAINT user_module_assignments_user_module_unique 
UNIQUE (user_id, module_id);