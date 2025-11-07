-- Ensure profiles table has proper role column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member';

-- Update role column to use check constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('member', 'admin', 'dev'));

-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Dev can manage all profiles" ON profiles;

-- Create new policies
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'dev')
  )
);

CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'dev')
  )
);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    title,
    gender,
    first_name,
    surname,
    year_of_birth,
    region,
    county,
    postcode,
    mobile,
    role,
    membership_status,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'title', ''),
    COALESCE(new.raw_user_meta_data->>'gender', ''),
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'surname', ''),
    COALESCE((new.raw_user_meta_data->>'year_of_birth')::integer, NULL),
    COALESCE(new.raw_user_meta_data->>'region', ''),
    COALESCE(new.raw_user_meta_data->>'county', ''),
    COALESCE(new.raw_user_meta_data->>'postcode', ''),
    COALESCE(new.raw_user_meta_data->>'mobile', ''),
    'member', -- Default role
    'pending', -- Default membership status
    now(),
    now()
  );

  -- Also insert referee information if provided
  IF new.raw_user_meta_data->>'referee_name' IS NOT NULL THEN
    INSERT INTO public.referees (
      user_id,
      referee_name,
      referee_mobile,
      local_admin_name,
      local_admin_mobile,
      created_at
    )
    VALUES (
      new.id,
      new.raw_user_meta_data->>'referee_name',
      new.raw_user_meta_data->>'referee_mobile',
      new.raw_user_meta_data->>'local_admin_name',
      new.raw_user_meta_data->>'local_admin_mobile',
      now()
    );
  END IF;

  RETURN new;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
