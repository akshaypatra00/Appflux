-- Create the apps table
create table public.apps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text not null,
  description text,
  download_count bigint default 0,
  github_release_id bigint,
  github_download_url text, -- Store the browser_download_url for quick access
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table public.apps enable row level security;

-- Policy: Allow public read access
create policy "Public apps work"
on public.apps
for select
to public
using (true);

-- Policy: Allow authenticated insert (assuming uplodaer is authenticated, or use service role key)
-- If we want to allow anyone to upload (NOT RECOMMENDED), use 'true'.
-- For now, let's assume authenticated users can upload.
create policy "Authenticated users can upload"
on public.apps
for insert
to authenticated
with check (true);

-- Policy: Allow Service Role full access (always implicitly true but good to note)
