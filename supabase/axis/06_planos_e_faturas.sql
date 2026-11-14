create table public.planos (
  id text primary key, nome text not null, descricao text,
  preco_mensal numeric(10,2) not null default 0,
  limite_obras integer, limite_usuarios integer,
  modulos text[] not null default '{}', ativo boolean not null default true, ordem integer not null default 0
);
alter table public.planos enable row level security;
create policy todos_leem_planos on public.planos for select to authenticated using (ativo);
create policy axis_admin_gerencia_planos on public.planos for all to authenticated using ((select public.eh_axis_admin())) with check ((select public.eh_axis_admin()));
alter table public.construtoras add column plano_id text references public.planos(id),
  add column ciclo text not null default 'MENSAL' check (ciclo in ('MENSAL','ANUAL')),
  add column assinatura_desde date, add column proxima_cobranca date;
create index ix_construtoras_plano on public.construtoras(plano_id);
create table public.faturas (
  id uuid primary key default gen_random_uuid(),
  construtora_id uuid not null references public.construtoras(id) on delete cascade,
  competencia character(7) not null, plano_id text references public.planos(id),
  valor numeric(10,2) not null, vencimento date not null,
  status text not null default 'ABERTA' check (status in ('ABERTA','PAGA','ATRASADA','CANCELADA')),
  pago_em timestamptz, forma_pagamento text, link_pagamento text, nota_fiscal_url text,
  criado_em timestamptz not null default now(), unique (construtora_id, competencia)
);
create index ix_faturas_construtora on public.faturas(construtora_id, vencimento desc);
create index ix_faturas_plano on public.faturas(plano_id);
alter table public.faturas enable row level security;
create policy admin_le_faturas on public.faturas for select to authenticated
  using ((construtora_id = (select public.minha_construtora()) and (select public.eh_admin_aprovado(auth.uid()))) or (select public.eh_axis_admin()));
create policy axis_admin_gerencia_faturas on public.faturas for all to authenticated using ((select public.eh_axis_admin())) with check ((select public.eh_axis_admin()));
