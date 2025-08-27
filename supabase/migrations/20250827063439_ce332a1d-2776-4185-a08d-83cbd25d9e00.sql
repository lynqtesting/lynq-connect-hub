-- Fix security vulnerability: Restrict module access to assigned users only
-- Drop the overly permissive policy that allows all authenticated users to view modules
DROP POLICY IF EXISTS "Authenticated users can view modules" ON public.modules;

-- Create a new restrictive policy that only allows users to view modules they're assigned to
CREATE POLICY "Users can view assigned modules" 
ON public.modules 
FOR SELECT 
USING (
  -- Allow admins to view all modules
  is_admin_user(auth.uid()) 
  OR 
  -- Allow users to view only modules they're assigned to
  EXISTS (
    SELECT 1 
    FROM public.user_module_assignments 
    WHERE user_module_assignments.user_id = auth.uid() 
    AND user_module_assignments.module_id = modules.id
  )
);