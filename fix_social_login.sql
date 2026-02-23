-- EMERGENCY DATABASE FIX FOR SOCIAL LOGIN
-- Run this in Supabase SQL Editor to fix "Database error saving new user"

-- 1. Ensure profiles table exists and allows NULLs for social login
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. IMPORTANT: Allow username to be NULL initially (for Google/GitHub signups)
ALTER TABLE public.profiles ALTER COLUMN username DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN last_name DROP NOT NULL;

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create policies (using DO block to avoid errors/duplicates)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
    CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
    CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
    CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
END
$$;

-- 5. Robust Trigger Function for Social Logins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_username TEXT;
BEGIN
  -- Try to get username from metadata, or fallback to NULL (Social logins usually have no username)
  -- We allow NULL so the onboarding page can catch it and ask the user to set one.
  extracted_username := new.raw_user_meta_data->>'username';

  INSERT INTO public.profiles (id, email, first_name, last_name, username, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    extracted_username, -- Can be NULL
    COALESCE(
        new.raw_user_meta_data->>'full_name', 
        (new.raw_user_meta_data->>'first_name' || ' ' || new.raw_user_meta_data->>'last_name')
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    username = COALESCE(EXCLUDED.username, profiles.username),
    updated_at = now();
    
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- If anything fails, log it but DO NOT BLOCK USER CREATION
  -- This allows the user to exist in Auth, and we can fix the profile later in the app
  RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
