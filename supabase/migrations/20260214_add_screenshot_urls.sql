
-- Add screenshot_urls column to apps table if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'apps' and column_name = 'screenshot_urls') then
    alter table apps add column screenshot_urls text[];
  end if;
end $$;
