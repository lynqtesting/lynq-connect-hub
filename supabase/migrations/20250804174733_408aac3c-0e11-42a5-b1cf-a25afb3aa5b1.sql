-- Add module_link column to modules table
ALTER TABLE public.modules 
ADD COLUMN module_link TEXT;