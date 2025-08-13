-- Secure modules table access: authenticated read, admin-only write
-- Ensure RLS is enabled
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view modules" ON public.modules;
DROP POLICY IF EXISTS "Admins can manage modules" ON public.modules;

-- Allow only authenticated users to view modules
CREATE POLICY "Authenticated users can view modules"
ON public.modules
FOR SELECT
TO authenticated
USING (true);

-- Admins can manage modules (insert, update, delete)
CREATE POLICY "Admins can manage modules"
ON public.modules
FOR ALL
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));