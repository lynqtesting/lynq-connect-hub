-- Add missing adapted_module_name column to modules table
ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS adapted_module_name TEXT;