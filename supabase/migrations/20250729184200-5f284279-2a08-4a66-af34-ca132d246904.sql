-- Create admin profile for current user if it doesn't exist
INSERT INTO profiles (user_id, username, is_admin)
SELECT 
  auth.uid(),
  'admin',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE user_id = auth.uid()
);

-- If profile already exists, update it to admin
UPDATE profiles 
SET is_admin = true 
WHERE user_id = auth.uid();