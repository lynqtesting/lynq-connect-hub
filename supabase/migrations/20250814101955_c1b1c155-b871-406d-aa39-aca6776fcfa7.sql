-- Fix security vulnerabilities in RLS policies

-- Fix user_module_assignments table policies
-- Drop the overly permissive admin policy
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.user_module_assignments;

-- Create more restrictive admin policies
CREATE POLICY "Admins can view all assignments" 
ON public.user_module_assignments 
FOR SELECT 
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can insert assignments" 
ON public.user_module_assignments 
FOR INSERT 
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admins can update assignments" 
ON public.user_module_assignments 
FOR UPDATE 
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete assignments" 
ON public.user_module_assignments 
FOR DELETE 
USING (is_admin_user(auth.uid()));

-- Fix recommendations table policies  
-- Drop the overly permissive admin policy
DROP POLICY IF EXISTS "Admins can manage recommendations" ON public.recommendations;

-- Create more restrictive admin policies
CREATE POLICY "Admins can view all recommendations" 
ON public.recommendations 
FOR SELECT 
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can insert recommendations" 
ON public.recommendations 
FOR INSERT 
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admins can update recommendations" 
ON public.recommendations 
FOR UPDATE 
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete recommendations" 
ON public.recommendations 
FOR DELETE 
USING (is_admin_user(auth.uid()));

-- Ensure all tables have RLS enabled
ALTER TABLE public.user_module_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;