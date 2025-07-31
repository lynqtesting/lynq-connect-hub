-- Add quantity column to requests table
ALTER TABLE public.requests 
ADD COLUMN quantity integer DEFAULT 1;