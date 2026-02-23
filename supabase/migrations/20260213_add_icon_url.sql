-- Add icon_url to apps table
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS icon_url text;

-- Add download_url to apps table (if we want to store it explicitly as well, though we had github_download_url)
-- Renaming github_download_url to download_url or keeping it is fine. Let's stick to existing schema and just add icon_url.
