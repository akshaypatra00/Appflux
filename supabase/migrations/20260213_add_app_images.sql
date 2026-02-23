-- Add icon_url and screenshot_url to apps table
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS icon_url text;
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS screenshot_url text;
