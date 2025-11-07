-- Fix infinite recursion in RLS policies by using a security definer function
-- This function bypasses RLS to check user roles

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create a security definer function to check if user is admin/dev
CREATE OR REPLACE FUNCTION public.is_admin_or_dev()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN user_role IN ('admin', 'dev');
END;
$$;

-- Create new policies using the security definer function
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (is_admin_or_dev());

CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
USING (is_admin_or_dev());

-- Also fix announcements policies if they have similar issues
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;

CREATE POLICY "Admins can manage announcements" 
ON announcements FOR ALL 
USING (is_admin_or_dev());

-- Fix other admin policies that might have recursion issues
DROP POLICY IF EXISTS "Admins can view all dependents" ON dependents;
DROP POLICY IF EXISTS "Admins can view all referees" ON referees;
DROP POLICY IF EXISTS "Admins can manage all contributions" ON contributions;
DROP POLICY IF EXISTS "Admins can manage funeral support" ON funeral_support;

CREATE POLICY "Admins can view all dependents" 
ON dependents FOR SELECT 
USING (is_admin_or_dev());

CREATE POLICY "Admins can view all referees" 
ON referees FOR SELECT 
USING (is_admin_or_dev());

CREATE POLICY "Admins can manage all contributions" 
ON contributions FOR ALL 
USING (is_admin_or_dev());

CREATE POLICY "Admins can manage funeral support" 
ON funeral_support FOR ALL 
USING (is_admin_or_dev());
