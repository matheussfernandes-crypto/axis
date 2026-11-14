create or replace view public.contrato_itens_saldo with (security_invoker = true) as
select i.id, i.contrato_id, i.codigo, i.descricao, i.unidade, i.quantidade_original, i.quantidade,
  i.valor_unitario, i.ordem, i.ativo, i.origem_aditivo, i.criado_em, i.construtora_id,
  coalesce(sum(case when l.status = 'APROVADO' then coalesce(li.quantidade_aprovada, li.quantidade_medida) end), 0) as qtd_aprovada,
  coalesce(sum(case when l.status = 'PENDENTE' then li.quantidade_medida end), 0) as qtd_pendente
from public.contrato_itens i
left join public.contrato_lancamento_itens li on li.item_id = i.id
left join public.contrato_lancamentos l on l.id = li.lancamento_id
group by i.id;
create table public.obra_fotos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  data_foto date not null default current_date, legenda text, storage_path text not null,
  criado_por uuid default auth.uid() references auth.users(id),
  criado_em timestamptz not null default now(),
  construtora_id uuid not null default public.minha_construtora() references public.construtoras(id) on delete cascade
);
create index obra_fotos_obra_data_idx on public.obra_fotos(obra_id, data_foto desc);
create index ix_obra_fotos_construtora on public.obra_fotos(construtora_id);
create index ix_obra_fotos_criado_por on public.obra_fotos(criado_por);
alter table public.obra_fotos enable row level security;
create policy isolamento_construtora on public.obra_fotos as restrictive for all to authenticated
  using (construtora_id = (select public.minha_construtora())) with check (construtora_id = (select public.minha_construtora()));
create policy aprovados_leem on public.obra_fotos for select to authenticated using ((select public.eh_usuario_aprovado(auth.uid())));
create policy aprovados_enviam on public.obra_fotos for insert to authenticated with check ((select public.eh_usuario_aprovado(auth.uid())));
create policy admin_ou_autor_exclui on public.obra_fotos for delete to authenticated using ((select public.eh_admin_aprovado(auth.uid())) or criado_por = (select auth.uid()));
insert into storage.buckets (id, name, public) values ('obra-fotos','obra-fotos', false) on conflict (id) do nothing;
create policy axis_fotos_le on storage.objects for select to authenticated
  using (bucket_id = 'obra-fotos' and (storage.foldername(name))[1] = public.minha_construtora()::text and public.eh_usuario_aprovado(auth.uid()));
create policy axis_fotos_envia on storage.objects for insert to authenticated
  with check (bucket_id = 'obra-fotos' and (storage.foldername(name))[1] = public.minha_construtora()::text and public.eh_usuario_aprovado(auth.uid()));
create policy axis_fotos_remove on storage.objects for delete to authenticated
  using (bucket_id = 'obra-fotos' and (storage.foldername(name))[1] = public.minha_construtora()::text and public.eh_usuario_aprovado(auth.uid()));
