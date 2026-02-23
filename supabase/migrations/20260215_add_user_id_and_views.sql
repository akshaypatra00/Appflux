-- Add user_id to apps table
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add views to apps table
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS views BIGINT DEFAULT 0;

-- Update RLS policies to ensure users can only insert/update/delete their own apps
-- (Assuming authenticated users can insert, but we should probably restrict to their own user_id)

-- Drop existing insert policy if it exists (it was "Authenticated users can upload" with check(true))
DROP POLICY IF EXISTS "Authenticated users can upload" ON public.apps;

-- Create strict insert policy
CREATE POLICY "Users can upload their own apps"
ON public.apps
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create update policy
CREATE POLICY "Users can update their own apps"
ON public.apps
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create delete policy
CREATE POLICY "Users can delete their own apps"
ON public.apps
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
