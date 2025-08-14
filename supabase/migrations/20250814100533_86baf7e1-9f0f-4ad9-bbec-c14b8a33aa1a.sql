-- Fix security vulnerability: Restrict request visibility to owners and admins only

-- Drop the overly permissive policy that allows anyone to view all requests
DROP POLICY IF EXISTS "Anyone can view requests" ON public.requests;

-- Create a secure policy that only allows users to view their own requests
CREATE POLICY "Users can view their own requests" 
ON public.requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Keep admin access intact (already exists)
-- "Admins can view all requests" policy remains unchanged

-- Ensure the table has RLS enabled (should already be enabled)
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;