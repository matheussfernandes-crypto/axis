-- AXIS · 08 · Arquitetura › Especificações (louças e metais, eletros, vidros e box) e Catálogo de modelos.
-- Tabelas novas esp_*, com construtora_id e isolamento RESTRICTIVE como as demais.
-- Quem lê e grava: ADMIN aprovado ou quem recebeu o módulo "arquitetura" em Acessos.

create or replace function public.pode_arquitetura()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis p join public.construtoras c on c.id = p.construtora_id
                 where p.id = auth.uid() and p.status = 'aprovado' and c.plano in ('TESTE','ATIVO')
                   and (p.setor = 'ADMIN' or p.acessos && array['arquitetura','arquitetura/especificacoes','arquitetura/catalogo']));
$$;
revoke execute on function public.pode_arquitetura() from public, anon;
grant execute on function public.pode_arquitetura() to authenticated;

-- projeto = uma unidade/cliente da arquitetura (ex.: "Apto 701"); pode ser ligado a uma obra
create table public.esp_projetos (
  id text primary key default gen_random_uuid()::text,
  codigo text,
  titulo text not null,
  cliente text,
  obra_id uuid references public.obras(id) on delete set null,
  unidade text,
  logo text,                              -- logo (PNG) que sai no cabeçalho do PDF deste projeto (bucket especificacoes)
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.esp_itens (
  id text primary key default gen_random_uuid()::text,
  projeto_id text not null references public.esp_projetos(id) on delete cascade,
  grupo text not null check (grupo in ('metais','eletros','vidros')),
  ambiente text not null default '',
  material text not null default '',
  referencia text not null default '',
  medidas text not null default '',
  qtd int not null default 1 check (qtd >= 1),
  img text not null default '',          -- caminho no bucket "especificacoes" (<construtora_id>/esp/...)
  ordem numeric not null default 0,
  vidro jsonb,                            -- só em vidros: altura, largura, ateTeto, perfil, vidro, folhas, correr, puxador, sistema, obs
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index esp_itens_projeto_idx on public.esp_itens (projeto_id, grupo);

create table public.esp_notas (
  projeto_id text not null references public.esp_projetos(id) on delete cascade,
  grupo text not null check (grupo in ('metais','eletros','vidros')),
  obs text not null default '',
  rev text not null default 'R0',
  papel text not null default 'a3p',
  primary key (projeto_id, grupo)
);

create table public.esp_modelos (
  id text primary key default gen_random_uuid()::text,
  grupo text not null check (grupo in ('metais','eletros','vidros')),
  material text not null default '',
  referencia text not null default '',
  medidas text not null default '',
  marca text not null default '',
  linha text not null default '',
  acab text not null default '',
  codigo text not null default '',
  faixa int check (faixa between 1 and 3),
  uso text not null default 'g' check (uso in ('b','c','s','g')),
  valor_ref numeric,
  valor_data date,
  img text not null default '',
  revisar boolean not null default false,
  ordem numeric not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['esp_projetos','esp_itens','esp_notas','esp_modelos'] loop
    execute format('alter table public.%I add column construtora_id uuid not null default public.minha_construtora() references public.construtoras(id) on delete cascade', t);
    execute format('create index %I on public.%I(construtora_id)', t || '_construtora_idx', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy isolamento_construtora on public.%I as restrictive for all to authenticated using (construtora_id = (select public.minha_construtora())) with check (construtora_id = (select public.minha_construtora()))', t);
    execute format('create policy arquitetura_usa on public.%I for all to authenticated using ((select public.pode_arquitetura())) with check ((select public.pode_arquitetura()))', t);
  end loop;
end $$;
create index esp_projetos_obra_idx on public.esp_projetos(obra_id);

-- fotos dos itens e modelos: bucket privado, sempre na pasta da construtora
insert into storage.buckets (id, name, public) values ('especificacoes','especificacoes', false) on conflict (id) do nothing;
create policy axis_esp_le on storage.objects for select to authenticated
  using (bucket_id = 'especificacoes' and (storage.foldername(name))[1] = public.minha_construtora()::text and public.pode_arquitetura());
create policy axis_esp_envia on storage.objects for insert to authenticated
  with check (bucket_id = 'especificacoes' and (storage.foldername(name))[1] = public.minha_construtora()::text and public.pode_arquitetura());
create policy axis_esp_remove on storage.objects for delete to authenticated
  using (bucket_id = 'especificacoes' and (storage.foldername(name))[1] = public.minha_construtora()::text and public.pode_arquitetura());
