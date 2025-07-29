-- Get the most recent user (which should be you) and create admin profile
INSERT INTO profiles (user_id, username, is_admin)
SELECT 
  id,
  'admin',
  true
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM profiles WHERE user_id IS NOT NULL)
ORDER BY created_at DESC 
LIMIT 1;

-- Also update any existing profile to be admin for the most recent user
UPDATE profiles 
SET is_admin = true 
WHERE user_id = (
  SELECT id FROM auth.users 
  ORDER BY created_at DESC 
  LIMIT 1
);