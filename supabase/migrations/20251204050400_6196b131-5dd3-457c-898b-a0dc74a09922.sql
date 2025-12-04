-- Add status and admin_comments columns to tweak_requests table
ALTER TABLE public.tweak_requests
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS admin_comments TEXT;

-- Add index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_tweak_requests_status ON public.tweak_requests(status);