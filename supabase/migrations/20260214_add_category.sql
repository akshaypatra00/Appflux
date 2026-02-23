
-- Add category column to apps table
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'apps' and column_name = 'category') then
    alter table apps add column category text;
  end if;
end $$;
