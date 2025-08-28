-- Phase 2: Secure Profile Management - Prevent users from modifying admin status
-- Add RLS policy to prevent users from updating their own is_admin field
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new restricted update policy
CREATE POLICY "Users can update their own profile (non-admin fields)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  -- Ensure users cannot modify is_admin field unless they are already admin
  (
    OLD.is_admin = NEW.is_admin OR 
    is_admin_user(auth.uid())
  )
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

  -- Normalize username (prefer provided username, else derive from email, else generate)
  normalized_username := coalesce(
    nullif(trim(user_username), ''),
    nullif(split_part(coalesce(user_email, ''), '@', 1), ''),
    'user_' || left(replace(gen_random_uuid()::text, '-', ''), 8)
  );

  -- If no email is provided, create an internal non-deliverable email from the username
  effective_email := coalesce(
    nullif(trim(user_email), ''),
    lower(normalized_username) || '@local.user'
  );

  -- Avoid silent collisions (soft checks)
  if exists (select 1 from public.profiles where lower(username) = lower(normalized_username)) then
    raise exception 'Username "%" is already taken', normalized_username;
  end if;

  if exists (select 1 from auth.users where lower(email) = lower(effective_email)) then
    raise exception 'An account with this identifier already exists';
  end if;

  -- Securely hash password (pgcrypto)
  hashed_password := crypt(user_password, gen_salt('bf'));

  -- Create the auth user with email confirmed to skip verification
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    effective_email,
    hashed_password,
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('username', normalized_username),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Create a profile record
  insert into public.profiles (user_id, username, is_admin)
  values (new_user_id, normalized_username, false);

  -- Return creation payload
  result := json_build_object(
    'user_id', new_user_id,
    'email', effective_email,
    'username', normalized_username
  );

  return result;
end;
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, username, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false)
  );
  RETURN NEW;
END;
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user(user_uuid uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
    (select is_admin from public.profiles where user_id = user_uuid limit 1),
    false
  );
$function$;