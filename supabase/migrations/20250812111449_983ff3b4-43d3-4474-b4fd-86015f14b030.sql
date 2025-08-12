
-- 1) Ensure the admin-check function exists and is resolvable
--    - SECURITY DEFINER so it can be used safely in RLS and RPCs
--    - Empty search_path with fully-qualified table reference prevents resolution issues
create or replace function public.is_admin_user(user_uuid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select coalesce(
    (select is_admin from public.profiles where user_id = user_uuid limit 1),
    false
  );
$function$;
