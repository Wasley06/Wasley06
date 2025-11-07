-- Create dev user in auth.users (this will trigger profile creation)
-- Note: In production, you should create this user through Supabase Auth UI
-- This is just for reference

-- First, let's ensure we can update profiles to set dev role
-- We'll need to manually set the dev role after user creation

-- Create a function to promote user to dev
CREATE OR REPLACE FUNCTION promote_to_dev(user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  -- Update profile role
  UPDATE profiles
  SET role = 'dev', updated_at = now()
  WHERE id = user_id;
END;
$$;

-- Create a function to promote user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  -- Update profile role
  UPDATE profiles
  SET role = 'admin', updated_at = now()
  WHERE id = user_id;
END;
$$;

-- Instructions: After creating the dev user through sign-up,
-- run: SELECT promote_to_dev('wasley@dev.com');

-- IMPORTANT: To set up the dev user, follow these steps:
-- 1. Go to /auth/sign-up and create an account with:
--    Email: wasley@dev.com
--    Password: Kingsley@06
--    Full Name: Wasley (or any name you prefer)
-- 2. Confirm the email address
-- 3. Run this SQL command to promote to dev:
--    SELECT promote_to_dev('wasley@dev.com');
-- 4. Now you can log in at /auth/dev-login with:
--    Username: Wasley@DEV
--    Password: Kingsley@06
