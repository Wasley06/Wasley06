-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, surname, title, gender, year_of_birth, region, county, postcode, mobile, role, membership_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'surname', ''),
    COALESCE(NEW.raw_user_meta_data->>'title', ''),
    COALESCE(NEW.raw_user_meta_data->>'gender', ''),
    COALESCE((NEW.raw_user_meta_data->>'year_of_birth')::INTEGER, NULL),
    COALESCE(NEW.raw_user_meta_data->>'region', ''),
    COALESCE(NEW.raw_user_meta_data->>'county', ''),
    COALESCE(NEW.raw_user_meta_data->>'postcode', ''),
    COALESCE(NEW.raw_user_meta_data->>'mobile', ''),
    'member',
    'pending'
  );

  -- Insert referee information if provided
  IF NEW.raw_user_meta_data->>'referee_name' IS NOT NULL THEN
    INSERT INTO public.referees (user_id, referee_name, referee_mobile, local_admin_name, local_admin_mobile)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'referee_name',
      NEW.raw_user_meta_data->>'referee_mobile',
      NEW.raw_user_meta_data->>'local_admin_name',
      NEW.raw_user_meta_data->>'local_admin_mobile'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
