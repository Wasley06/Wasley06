-- Set the dev role for the user with email wasleyinc@gmail.com
-- Run this script after the user has signed up in Supabase

-- Update the role to 'dev' for the specified user
UPDATE profiles
SET role = 'dev'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'wasleyinc@gmail.com'
);

-- Verify the update
SELECT p.id, p.first_name, p.surname, p.role, u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'wasleyinc@gmail.com';
