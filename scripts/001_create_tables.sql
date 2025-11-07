-- Create profiles table for extended user information
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
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin', 'super_admin')),
  membership_status VARCHAR(20) DEFAULT 'pending' CHECK (membership_status IN ('pending', 'active', 'suspended', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dependents table
CREATE TABLE IF NOT EXISTS dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  full_name VARCHAR(200) NOT NULL,
  relationship VARCHAR(50),
  year_of_birth INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referees table
CREATE TABLE IF NOT EXISTS referees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referee_name VARCHAR(200) NOT NULL,
  referee_mobile VARCHAR(20),
  local_admin_name VARCHAR(200),
  local_admin_mobile VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contributions table for tracking payments
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) CHECK (payment_method IN ('bank_transfer', 'stripe', 'paypal', 'cash')),
  payment_reference VARCHAR(100),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  contribution_type VARCHAR(50) DEFAULT 'monthly' CHECK (contribution_type IN ('monthly', 'annual', 'emergency', 'funeral')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create funeral_support table for tracking funeral assistance
CREATE TABLE IF NOT EXISTS funeral_support (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deceased_member_id UUID REFERENCES profiles(id),
  family_contact_name VARCHAR(200),
  family_contact_mobile VARCHAR(20),
  date_of_death DATE,
  funeral_location VARCHAR(200),
  repatriation_needed BOOLEAN DEFAULT false,
  total_cost DECIMAL(10, 2),
  amount_disbursed DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create announcements table for community updates
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE referees ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE funeral_support ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Dependents policies
CREATE POLICY "Users can manage their own dependents" ON dependents
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all dependents" ON dependents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Referees policies
CREATE POLICY "Users can manage their own referees" ON referees
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all referees" ON referees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Contributions policies
CREATE POLICY "Users can view their own contributions" ON contributions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all contributions" ON contributions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Funeral support policies
CREATE POLICY "Admins can manage funeral support" ON funeral_support
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Members can view funeral support" ON funeral_support
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND membership_status = 'active'
    )
  );

-- Announcements policies
CREATE POLICY "Everyone can view published announcements" ON announcements
  FOR SELECT USING (published = true);

CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
