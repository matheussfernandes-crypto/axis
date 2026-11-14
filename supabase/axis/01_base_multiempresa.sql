-- AXIS · 01 · Base multiempresa (construtoras, perfis, login com aprovação)
-- Cada construtora só enxerga os próprios dados: toda tabela de negócio tem
-- construtora_id (preenchido automaticamente) e uma política RESTRICTIVE.

set check_function_bodies = off;

-- ── Construtoras (clientes do Axis) ───────────────────────────────────────
create table public.construtoras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  codigo_convite text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  plano text not null default 'TESTE' check (plano in ('TESTE','ATIVO','SUSPENSO','CANCELADO')),
  teste_ate date default (current_date + 30),
  logo_url text,
  criado_em timestamptz not null default now()
);

-- Administradores do próprio Axis (você), que gerenciam as construtoras.
create table public.axis_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);

-- ── Perfis de usuário ─────────────────────────────────────────────────────
create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  construtora_id uuid references public.construtoras(id) on delete cascade,
  nome_completo text not null,
  email text not null,
  setor text not null check (setor in ('ESTAGIARIO','ADMIN','RH','FINANCEIRO','ARQUITETO','ENGENHEIRO','MESTRE_GERAL')),
  status text not null default 'pendente' check (status in ('pendente','aprovado','rejeitado','desativado','excluido')),
  criado_em timestamptz not null default now(),
  decidido_por uuid references auth.users(id),
  decidido_em timestamptz,
  acesso_andamento_novo boolean not null default false,
  acessos text[] not null default '{}',
  atalhos_home text[]
);
create index perfis_construtora_idx on public.perfis(construtora_id);

-- ── Funções de apoio (security definer evita recursão nas políticas) ──────
create or replace function public.minha_construtora()
returns uuid language sql stable security definer set search_path = public as $$
  select construtora_id from public.perfis where id = auth.uid();
$$;

create or replace function public.eh_axis_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.axis_admins where user_id = auth.uid());
$$;

create or replace function public.eh_usuario_aprovado(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis p join public.construtoras c on c.id = p.construtora_id
                 where p.id = uid and p.status = 'aprovado' and c.plano in ('TESTE','ATIVO'));
$$;

create or replace function public.eh_admin_aprovado(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis p join public.construtoras c on c.id = p.construtora_id
                 where p.id = uid and p.setor = 'ADMIN' and p.status = 'aprovado' and c.plano in ('TESTE','ATIVO'));
$$;

create or replace function public.eh_estagiario_ou_admin_aprovado(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis p join public.construtoras c on c.id = p.construtora_id
                 where p.id = uid and p.setor in ('ESTAGIARIO','ADMIN') and p.status = 'aprovado' and c.plano in ('TESTE','ATIVO'));
$$;

create or replace function public.tem_setor(setores text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis p join public.construtoras c on c.id = p.construtora_id
                 where p.id = auth.uid() and p.status = 'aprovado' and p.setor = any(setores) and c.plano in ('TESTE','ATIVO'));
$$;

-- Nomes de colegas (só da mesma construtora)
create or replace function public.nomes_perfis(uids uuid[])
returns table(id uuid, nome_completo text) language sql stable security definer set search_path = public as $$
  select id, nome_completo from public.perfis
  where id = any(uids) and construtora_id = public.minha_construtora();
$$;

-- ── Cadastro: criar construtora nova OU entrar com código de convite ──────
-- metadata do signUp:
--   { nome_completo, setor, nome_construtora }  → cria a construtora; a pessoa vira ADMIN aprovado
--   { nome_completo, setor, codigo_convite }    → entra na construtora existente como 'pendente'
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_construtora uuid;
  v_codigo text := upper(trim(coalesce(new.raw_user_meta_data->>'codigo_convite', '')));
  v_nome_construtora text := trim(coalesce(new.raw_user_meta_data->>'nome_construtora', ''));
begin
  if v_nome_construtora <> '' then
    insert into public.construtoras (nome, cnpj)
    values (v_nome_construtora, nullif(trim(coalesce(new.raw_user_meta_data->>'cnpj','')), ''))
    returning id into v_construtora;
    insert into public.perfis (id, construtora_id, nome_completo, email, setor, status, decidido_em)
    values (new.id, v_construtora, coalesce(new.raw_user_meta_data->>'nome_completo', new.email),
            new.email, 'ADMIN', 'aprovado', now());
    insert into public.configuracoes_notificacao (construtora_id) values (v_construtora);
  else
    select id into v_construtora from public.construtoras where codigo_convite = v_codigo;
    if v_construtora is null then
      raise exception 'Código de convite inválido';
    end if;
    insert into public.perfis (id, construtora_id, nome_completo, email, setor, status)
    values (new.id, v_construtora, coalesce(new.raw_user_meta_data->>'nome_completo', new.email),
            new.email, coalesce(nullif(new.raw_user_meta_data->>'setor',''), 'ESTAGIARIO'), 'pendente');
  end if;
  return new;
end;
$$;

-- Impede que um usuário comum mude o próprio setor, status, acessos ou construtora
create or replace function public.protege_campos_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.eh_axis_admin() then return new; end if;
  new.construtora_id := old.construtora_id;
  if not public.eh_admin_aprovado(auth.uid()) then
    new.setor := old.setor; new.status := old.status; new.acessos := old.acessos;
    new.acesso_andamento_novo := old.acesso_andamento_novo;
    new.decidido_por := old.decidido_por; new.decidido_em := old.decidido_em;
  end if;
  return new;
end;
$$;
create trigger trg_protege_campos_perfil before update on public.perfis
  for each row execute function public.protege_campos_perfil();

-- ── Políticas: construtoras, perfis, axis_admins ──────────────────────────
alter table public.construtoras enable row level security;
alter table public.axis_admins enable row level security;
alter table public.perfis enable row level security;

create policy construtora_le_a_propria on public.construtoras for select to authenticated
  using (id = (select public.minha_construtora()) or (select public.eh_axis_admin()));
create policy admin_edita_a_propria on public.construtoras for update to authenticated
  using ((id = (select public.minha_construtora()) and (select public.eh_admin_aprovado(auth.uid()))) or (select public.eh_axis_admin()))
  with check ((id = (select public.minha_construtora()) and (select public.eh_admin_aprovado(auth.uid()))) or (select public.eh_axis_admin()));
create policy axis_admin_gerencia on public.construtoras for all to authenticated
  using ((select public.eh_axis_admin())) with check ((select public.eh_axis_admin()));

create policy axis_admins_leem on public.axis_admins for select to authenticated
  using (user_id = auth.uid());

create policy perfil_ve_o_proprio on public.perfis for select to authenticated using (id = (select auth.uid()));
create policy perfil_atualiza_o_proprio on public.perfis for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy admin_ve_perfis on public.perfis for select to authenticated using ((select public.eh_admin_aprovado(auth.uid())));
create policy admin_decide_perfis on public.perfis for update to authenticated using ((select public.eh_admin_aprovado(auth.uid())));
-- Isolamento: nunca enxergar/alterar perfis de outra construtora
create policy isolamento_construtora on public.perfis as restrictive for all to authenticated
  using (id = (select auth.uid()) or construtora_id = (select public.minha_construtora()))
  with check (id = (select auth.uid()) or construtora_id = (select public.minha_construtora()));
