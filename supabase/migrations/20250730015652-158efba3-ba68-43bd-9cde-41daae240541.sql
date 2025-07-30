-- Check if pgcrypto extension is properly enabled and create a simpler function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop and recreate the function with proper error handling
DROP FUNCTION IF EXISTS create_user_admin(TEXT, TEXT, TEXT);

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
  hashed_password TEXT;
  result json;
BEGIN
  -- Generate a new user ID
  new_user_id := gen_random_uuid();
  
  -- Hash the password using pgcrypto
  hashed_password := crypt(user_password, gen_salt('bf'));
  
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
    new_user_id,
    'authenticated',
    'authenticated',
    user_email,
    hashed_password,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    COALESCE(json_build_object('username', user_username), '{}'),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

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