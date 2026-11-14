alter table public.construtoras add column logo_path text, add column logo_atualizado_em timestamptz;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', false, 2097152, array['image/png'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy axis_logo_le on storage.objects for select to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = public.minha_construtora()::text and public.eh_usuario_aprovado(auth.uid()));
create policy axis_logo_envia on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = public.minha_construtora()::text and public.eh_admin_aprovado(auth.uid()));
create policy axis_logo_atualiza on storage.objects for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = public.minha_construtora()::text and public.eh_admin_aprovado(auth.uid()));
create policy axis_logo_remove on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = public.minha_construtora()::text and public.eh_admin_aprovado(auth.uid()));
