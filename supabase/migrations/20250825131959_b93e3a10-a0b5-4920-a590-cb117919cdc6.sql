-- Fix security issues: Add proper RLS policies for users and requests tables

-- 1. Fix users table - restrict public access to email addresses
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;

CREATE POLICY "Admins can view all users" 
ON public.users 
FOR SELECT 
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can insert users" 
ON public.users 
FOR INSERT 
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admins can update users" 
ON public.users 
FOR UPDATE 
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete users" 
ON public.users 
FOR DELETE 
USING (is_admin_user(auth.uid()));

-- 2. Fix requests table - restrict business-sensitive data access
DROP POLICY IF EXISTS "Anyone can create requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can update requests" ON public.requests;

CREATE POLICY "Users can create their own requests" 
ON public.requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own requests" 
ON public.requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests" 
ON public.requests 
FOR SELECT 
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can update requests" 
ON public.requests 
FOR UPDATE 
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete requests" 
ON public.requests 
FOR DELETE 
USING (is_admin_user(auth.uid()));