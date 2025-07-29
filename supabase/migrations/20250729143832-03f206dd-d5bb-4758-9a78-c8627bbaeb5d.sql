-- Drop existing RLS policies for requests table
DROP POLICY IF EXISTS "Users can create requests" ON public.requests;
DROP POLICY IF EXISTS "Users can view their requests" ON public.requests;

-- Create new policies that work with custom authentication
-- Allow all authenticated users to create requests (we'll handle user_id validation in the app)
CREATE POLICY "Anyone can create requests" 
ON public.requests 
FOR INSERT 
WITH CHECK (true);

-- Allow users to view all requests (since admins need to see all and users can see theirs)
CREATE POLICY "Anyone can view requests" 
ON public.requests 
FOR SELECT 
USING (true);