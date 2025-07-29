-- Add duration column to requests table
ALTER TABLE public.requests 
ADD COLUMN duration INTEGER DEFAULT 1 CHECK (duration >= 1 AND duration <= 3);