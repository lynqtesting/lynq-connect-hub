-- Enable realtime for modules table
ALTER TABLE public.modules REPLICA IDENTITY FULL;

-- Add modules table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.modules;

-- Add version column for optimistic concurrency control
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;