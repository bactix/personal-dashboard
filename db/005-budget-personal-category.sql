-- Run once in the Supabase SQL editor. Safe to run more than once.
-- Adds the "personal" category to budgets. (The enum type name is looked up, so no guessing.)
do $$
declare
  enum_type text;
begin
  select format_type(a.atttypid, null) into enum_type
    from pg_attribute a where a.attrelid = 'public.budgets'::regclass and a.attname = 'category';
  execute format('alter type %s add value if not exists %L', enum_type, 'personal');
end $$;

notify pgrst, 'reload schema';
