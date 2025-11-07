-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(10),
  gender VARCHAR(20),
  first_name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  year_of_birth INTEGER,
  region VARCHAR(100),
  county VARCHAR(100),
  postcode VARCHAR(20),
  mobile VARCHAR(20),
  role VARCHAR(20) DEFAULT 'member',
  membership_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cause_code VARCHAR(50) NOT NULL,
  reference_number VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  goodwill DECIMAL(10, 2) DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'bank_transfer',
  payment_status VARCHAR(20) DEFAULT 'completed',
  contribution_type VARCHAR(50) DEFAULT 'funeral',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  priority VARCHAR(20) DEFAULT 'normal',
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Contributions policies
DROP POLICY IF EXISTS "Users view own contributions" ON contributions;
CREATE POLICY "Users view own contributions" ON contributions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage contributions" ON contributions;
CREATE POLICY "Admins manage contributions" ON contributions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Announcements policies
DROP POLICY IF EXISTS "View published announcements" ON announcements;
CREATE POLICY "View published announcements" ON announcements FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Admins manage announcements" ON announcements;
CREATE POLICY "Admins manage announcements" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
