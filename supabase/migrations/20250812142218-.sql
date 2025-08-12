-- Ensure pgcrypto is available for password hashing
create extension if not exists pgcrypto with schema extensions;

-- Recreate the admin-only user creation function with proper privileges
create or replace function public.create_user_admin(
  user_email text,
  user_password text,
  user_username text default null::text
)
returns json
language plpgsql
security definer
set search_path to 'public, extensions'
as $function$
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

-- Ensure the function runs with the proper authority
alter function public.create_user_admin(text, text, text) owner to supabase_auth_admin;

-- Allow app roles to call these functions
grant execute on function public.create_user_admin(text, text, text) to anon, authenticated;
grant execute on function public.is_admin_user(uuid) to anon, authenticated;