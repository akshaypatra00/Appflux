-- Add onboarding fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_source TEXT;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS platform_usage TEXT;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_position TEXT;
-- Refresh schema cache
NOTIFY pgrst,
'reload config';