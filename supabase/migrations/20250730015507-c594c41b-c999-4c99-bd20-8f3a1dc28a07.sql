-- Enable the pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the admin function to properly handle password hashing
CREATE OR REPLACE FUNCTION create_user_admin(
  user_email TEXT,
  user_password TEXT,
  user_username TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
  result json;
BEGIN
  -- Create user in auth.users with email_confirmed_at set
  INSERT INTO auth.users (
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
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(), -- This confirms the email immediately
    '{"provider":"email","providers":["email"]}',
    COALESCE(json_build_object('username', user_username), '{}'),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Create the profile
  INSERT INTO public.profiles (user_id, username, is_admin)
  VALUES (
    new_user_id,
    COALESCE(user_username, split_part(user_email, '@', 1)),
    false
  );

  -- Return the result
  result := json_build_object(
    'user_id', new_user_id,
    'email', user_email,
    'username', COALESCE(user_username, split_part(user_email, '@', 1))
  );

  RETURN result;
END;
$$;