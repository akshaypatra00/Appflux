-- Add user_id to apps table if it doesn't exist
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add views column if it doesn't exist
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS views BIGINT DEFAULT 0;

-- Refresh the schema cache (notify PostgREST)
NOTIFY pgrst, 'reload config';

-- Update RLS policies
DROP POLICY IF EXISTS "Authenticated users can upload" ON public.apps;
DROP POLICY IF EXISTS "Users can upload their own apps" ON public.apps;

CREATE POLICY "Users can upload their own apps"
ON public.apps
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own apps" ON public.apps;

CREATE POLICY "Users can update their own apps"
ON public.apps
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own apps" ON public.apps;

CREATE POLICY "Users can delete their own apps"
ON public.apps
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
