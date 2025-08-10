-- Add missing columns to modules table for tweak content and adaptive modules functionality
ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS tweak_content_request TEXT,
ADD COLUMN IF NOT EXISTS adaptive_modules JSONB;