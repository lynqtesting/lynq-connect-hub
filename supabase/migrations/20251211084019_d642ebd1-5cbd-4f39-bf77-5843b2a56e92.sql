-- Create rate limits table for tracking API usage
CREATE TABLE public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  request_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint, request_date)
);

-- Enable RLS
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view their own rate limits
CREATE POLICY "Users can view their own rate limits"
  ON public.api_rate_limits
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_rate_limits_user_endpoint_date 
  ON public.api_rate_limits (user_id, endpoint, request_date);