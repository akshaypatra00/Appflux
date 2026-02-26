-- Supabase Schema for Firebase Auth Compatibility
-- This script sets up the database to use Firebase UIDs (which are strings) as user IDs.
-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    -- Firebase UID
    username TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    user_position TEXT,
    platform_usage TEXT,
    referral_source TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
-- 2. Apps Table
CREATE TABLE IF NOT EXISTS public.apps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    version TEXT,
    description TEXT,
    category TEXT,
    github_download_url TEXT,
    icon_url TEXT,
    screenshot_urls TEXT [],
    -- Array of strings
    size BIGINT,
    size_formatted TEXT,
    download_count BIGINT DEFAULT 0,
    views BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
-- 3. Deployments Table
CREATE TABLE IF NOT EXISTS public.deployments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    -- pending, building, deployed, failed
    logs TEXT,
    deployment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
-- 4. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    -- info, success, warning, error
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
-- 5. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- Allow everyone to read
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR
SELECT USING (true);
CREATE POLICY "Public apps are viewable" ON public.apps FOR
SELECT USING (true);
CREATE POLICY "Public deployments are viewable" ON public.deployments FOR
SELECT USING (true);
CREATE POLICY "Public notifications are viewable" ON public.notifications FOR
SELECT USING (true);
-- Allow everyone to write (PERMISSIVE FOR FIREBASE AUTH)
CREATE POLICY "Allow all on profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow all on apps" ON public.apps FOR ALL USING (true);
CREATE POLICY "Allow all on deployments" ON public.deployments FOR ALL USING (true);
CREATE POLICY "Allow all on notifications" ON public.notifications FOR ALL USING (true);
-- Note: In a production environment with Firebase Auth, you would typically
-- use a custom JWT validator for RLS or use a Service Role client in a secure backend (like Next.js API routes).
-- For this setup, we'll implement write operations from the app.
-- To allow the frontend client to write without Supabase Auth, you'd need more permissive policies
-- or use the "anon" role which is not secure unless you have another way to verify the user.
-- recommendation: Use Service Role in Next.js API routes for writes.
-- Allow anon to insert/update (ONLY FOR INITIAL SETUP - PLEASE SECURE THIS)
-- CREATE POLICY "Allow anon insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow anon update profiles" ON public.profiles FOR UPDATE USING (true);
-- CREATE POLICY "Allow anon insert apps" ON public.apps FOR INSERT WITH CHECK (true);