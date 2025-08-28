-- Phase 2: Secure Profile Management - Prevent users from modifying admin status
-- Drop existing policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new restricted update policy that prevents users from changing their admin status
CREATE POLICY "Users can update their own profile (restricted)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  -- Only allow admin changes if the user is already an admin
  (NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = false
  ) OR is_admin_user(auth.uid()))
);

-- Phase 3: Fix Database Function Security - Set proper search_path for all functions
-- Update create_user_admin function
CREATE OR REPLACE FUNCTION public.create_user_admin(user_email text, user_password text, user_username text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  new_user_id uuid := gen_random_uuid();
  normalized_username text;
  effective_email text;
  hashed_password text;
  result json;
begin
  -- Only admins can create users
  if not is_admin_user(auth.uid()) then
    raise exception 'Only admins can create users';
  end if;

  -- Normalize username
  normalized_username := coalesce(
    nullif(trim(user_username), ''),
    nullif(split_part(coalesce(user_email, ''), '@', 1), ''),
    'user_' || left(replace(gen_random_uuid()::text, '-', ''), 8)
  );

  -- Create effective email
  effective_email := coalesce(
    nullif(trim(user_email), ''),
    lower(normalized_username) || '@local.user'
  );

  -- Check for collisions
  if exists (select 1 from public.profiles where lower(username) = lower(normalized_username)) then
    raise exception 'Username "%" is already taken', normalized_username;
  end if;

  if exists (select 1 from auth.users where lower(email) = lower(effective_email)) then
    raise exception 'An account with this identifier already exists';
  end if;

  -- Hash password
  hashed_password := crypt(user_password, gen_salt('bf'));

  -- Create auth user
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated',
    'authenticated', effective_email, hashed_password, now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('username', normalized_username),
    now(), now(), '', '', '', ''
  );

  -- Create profile
  insert into public.profiles (user_id, username, is_admin)
  values (new_user_id, normalized_username, false);

  result := json_build_object(
    'user_id', new_user_id,
    'email', effective_email,
    'username', normalized_username
  );

  return result;
end;
$function$;