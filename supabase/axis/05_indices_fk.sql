do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass as tbl, c.conname, a.attname
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    join pg_namespace n on n.oid = (select relnamespace from pg_class where oid = c.conrelid)
    where c.contype = 'f' and n.nspname = 'public' and array_length(c.conkey,1) = 1
      and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1])
  loop
    execute format('create index if not exists %I on %s(%I)', 'ix_' || r.conname, r.tbl, r.attname);
  end loop;
end $$;
