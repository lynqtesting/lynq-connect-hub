-- Fix tweakable_questions schema - remove category field to standardize
-- This ensures upload and edit UIs are consistent (Title + Description only)

ALTER TABLE public.tweakable_questions 
DROP COLUMN IF EXISTS category;

-- Add index for better performance on module-based queries
CREATE INDEX IF NOT EXISTS idx_tweakable_questions_module_id 
ON public.tweakable_questions(module_id) 
WHERE is_active = true;