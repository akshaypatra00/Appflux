-- Rename screenshot_url to accept an array or JSON, but to keep it simple and scalable
-- we will drop the old column (if it has data it will be lost, assume dev phase)
-- and add screenshot_urls as a text array

ALTER TABLE public.apps DROP COLUMN IF EXISTS screenshot_url;
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS screenshot_urls text[];
