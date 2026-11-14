-- AXIS · 02 · Obras, Medições e Vales, Contratos de terceirizados
-- Estrutura baseada no funcionamento do sistema original, SEM nenhum dado.
-- Toda tabela recebe construtora_id no fim deste arquivo (bloco "isolamento").

set check_function_bodies = off;

create table public.configuracoes_notificacao (
  construtora_id uuid primary key references public.construtoras(id) on delete cascade,
  email_1 text, email_2 text, email_3 text, email_4 text
);

create table public.obras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  endereco text,
  cidade text,
  logo_url text,
  exibir_no_painel boolean not null default true,
  data_inicio date,
  data_entrega_prevista date,
  -- Situação da obra:
  --   EM_ANDAMENTO → aparece em tudo (andamento, medições, contratos)
  --   CONCLUIDA    → sai do Andamento; medições/contratos continuam até a entrega + 4 meses
  --   ENTREGUE     → a partir de data_entrega_real + 4 meses, só aparece em Vistoria e Pós-obra
  status text not null default 'EM_ANDAMENTO' check (status in ('EM_ANDAMENTO','CONCLUIDA','ENTREGUE')),
  data_conclusao date,
  data_entrega_real date,
  observacoes text,
  criado_em timestamptz not null default now()
);

create table public.pessoas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  papel text not null default 'EMPREITEIRO' check (papel in ('EMPREITEIRO','MESTRE','MESTRE_GERAL','CONTRAMESTRE')),
  obra_id uuid references public.obras(id),
  admissao date not null,
  status text not null default 'ATIVO' check (status in ('ATIVO','INATIVO')),
  saida date,
  saldo_inicial_retido numeric(12,2) not null default 0
);

create table public.retencoes_pessoa (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  mes character(7) not null,
  percent numeric(5,4) not null,
  alterado_em timestamptz not null default now()
);

create table public.log_alteracoes_retencao (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  obra_id uuid references public.obras(id),
  mes_aplicacao character(7) not null,
  percent_anterior numeric(5,4) not null,
  percent_novo numeric(5,4) not null,
  alterado_por uuid references auth.users(id),
  alterado_em timestamptz not null default now()
);

create table public.servicos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('area','linear','unidade','diaria')),
  valor_unitario numeric(12,2) not null default 0,
  criado_em timestamptz not null default now()
);

create table public.empresas_terceirizadas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text, contato text, email text, telefone text, observacoes text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  nome_empresarial text, inscricao_municipal text, endereco text, cep text, bairro text,
  municipio text, uf character(2), especialidade text, whatsapp text
);

create table public.empresa_obra (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas_terceirizadas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  tipo_servico text not null,
  data_inicio date not null,
  data_termino date,
  status text not null default 'ATIVO' check (status in ('ATIVO','INATIVO','ENCERRADO')),
  retencao_contratual boolean not null default false,
  retencao_pct numeric(5,2) default 0,
  contrato_pdf_path text,
  observacoes text,
  criado_em timestamptz not null default now()
);
create index idx_empresa_obra_empresa on public.empresa_obra(empresa_id);
create index idx_empresa_obra_obra on public.empresa_obra(obra_id);

create table public.fechamentos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id),
  tipo text not null check (tipo in ('MEDICAO','VALE')),
  mes_referencia character(7) not null,
  fechado_por uuid references auth.users(id),
  fechado_em timestamptz not null default now(),
  email_enviado_para text,
  pdf_path text,
  unique (obra_id, tipo, mes_referencia)
);

create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references public.pessoas(id),
  obra_id uuid not null references public.obras(id),
  tipo text not null check (tipo in ('MEDICAO','VALE','VALE_MEDICAO')),
  mes_referencia character(7) not null,
  total_reais numeric(12,2) not null,
  retencao_pct_usado numeric(5,4),
  status text not null default 'PENDENTE' check (status in ('PENDENTE','APROVADO','REJEITADO')),
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  data date not null default current_date,
  servico text, local text,
  quantidade numeric(12,2),
  detalhe_texto text,
  valor_unitario_usado numeric(12,2),
  valor_bruto numeric(12,2),
  retencao_item numeric(12,2),
  vale_real boolean not null default false,
  valor_vale_hibrido numeric(12,2),
  observacao_medicao text,
  editado_em timestamptz, editado_por uuid references auth.users(id),
  aprovado_em timestamptz, aprovado_por uuid references auth.users(id),
  motivo_rejeicao text,
  tipo_contratado text not null default 'PROPRIO' check (tipo_contratado in ('PROPRIO','TERCEIRIZADA')),
  empresa_obra_id uuid references public.empresa_obra(id) on delete set null,
  vale_descontado_em timestamptz,
  vale_descontado_fechamento_id uuid,
  ajuste_saldo boolean not null default false
);
create index lancamentos_obra_mes_idx on public.lancamentos(obra_id, mes_referencia);
create index lancamentos_pessoa_idx on public.lancamentos(pessoa_id);
create index lancamentos_vale_pendente_idx on public.lancamentos(obra_id, pessoa_id) where vale_descontado_em is null and status = 'APROVADO';

create table public.retiradas_retido (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references public.pessoas(id),
  obra_id uuid references public.obras(id),
  valor numeric(12,2) not null,
  data date not null default current_date,
  observacao text,
  lancado_por uuid references auth.users(id)
);

create table public.log_auditoria (
  id uuid primary key default gen_random_uuid(),
  tabela text not null,
  acao text not null check (acao in ('INSERT','UPDATE','DELETE')),
  registro_id uuid,
  dados_anteriores jsonb,
  dados_novos jsonb,
  feito_por uuid references auth.users(id),
  feito_em timestamptz not null default now()
);
create index idx_log_auditoria_feito_em on public.log_auditoria(feito_em desc);

-- Notificações e push são do usuário (não precisam de construtora_id)
create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null, corpo text, url text,
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null, p256dh text not null, auth text not null,
  created_at timestamptz default now(),
  unique (user_id, endpoint)
);
create table public.solicitacoes_acesso (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  modulo text not null,
  criado_em timestamptz not null default now(),
  resolvido_em timestamptz,
  aprovado boolean
);

-- ── Contratos de terceirizados ────────────────────────────────────────────
create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  numero text not null,
  obra_id uuid not null references public.obras(id),
  empresa_id uuid not null references public.empresas_terceirizadas(id),
  objeto text not null,
  data_inicio date, data_termino date,
  status text not null default 'ATIVO' check (status in ('ATIVO','SUSPENSO','ENCERRADO')),
  observacoes text,
  empresa_obra_id uuid references public.empresa_obra(id),
  criado_por uuid default auth.uid() references auth.users(id),
  criado_em timestamptz not null default now()
);
create table public.contrato_itens (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  codigo text, descricao text not null,
  unidade text not null default 'm²',
  quantidade_original numeric not null default 0,
  quantidade numeric not null default 0,
  valor_unitario numeric not null default 0,
  ordem integer not null default 0,
  ativo boolean not null default true,
  origem_aditivo boolean not null default false,
  criado_em timestamptz not null default now()
);
create table public.contrato_precos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  servico text not null, unidade text not null,
  valor_unitario numeric(14,2) not null check (valor_unitario >= 0),
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);
create table public.contrato_retencoes (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  vigente_desde character(7) not null,
  percent numeric not null default 0,
  motivo text,
  alterado_por uuid default auth.uid() references auth.users(id),
  alterado_em timestamptz not null default now()
);
create table public.contrato_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  tipo text not null check (tipo in ('AUMENTO','NOVO_SERVICO')),
  item_id uuid references public.contrato_itens(id),
  descricao text, unidade text,
  quantidade numeric not null default 0,
  justificativa text not null,
  status text not null default 'AGUARDANDO' check (status in ('AGUARDANDO','APROVADA','DESAPROVADA')),
  motivo_resposta text,
  respondido_por uuid references auth.users(id),
  respondido_em timestamptz,
  criado_por uuid default auth.uid() references auth.users(id),
  criado_em timestamptz not null default now()
);
create table public.contrato_aditivos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  tipo text not null check (tipo in ('ACRESCIMO','SUPRESSAO','ITEM_NOVO','PRECO')),
  item_id uuid references public.contrato_itens(id),
  quantidade_anterior numeric, quantidade_nova numeric,
  valor_unitario_anterior numeric, valor_unitario_novo numeric,
  justificativa text,
  solicitacao_id uuid references public.contrato_solicitacoes(id),
  criado_por uuid default auth.uid() references auth.users(id),
  criado_em timestamptz not null default now()
);
create table public.contrato_fechamentos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  mes_referencia character(7) not null,
  valor_bruto numeric not null default 0,
  retencao_valor numeric not null default 0,
  vales_descontados numeric not null default 0,
  valor_liquido numeric not null default 0,
  fechado_por uuid default auth.uid() references auth.users(id),
  fechado_em timestamptz not null default now(),
  unique (contrato_id, mes_referencia)
);
create table public.contrato_lancamentos (
  id uuid primary key default gen_random_uuid(),
  numero integer not null,
  contrato_id uuid not null references public.contratos(id),
  tipo text not null check (tipo in ('MEDICAO','VALE','VALE_MEDICAO')),
  data date not null default current_date,
  mes_referencia character(7) not null,
  status text not null default 'PENDENTE' check (status in ('PENDENTE','APROVADO','REJEITADO')),
  valor_medido numeric not null default 0,
  valor_bruto numeric not null default 0,
  retencao_aplicada boolean not null default true,
  retencao_pct numeric not null default 0,
  retencao_valor numeric not null default 0,
  retencao_dispensa_motivo text,
  valor_vale numeric not null default 0,
  valor_liquido numeric not null default 0,
  teve_glosa boolean not null default false,
  observacao text,
  criado_por uuid default auth.uid() references auth.users(id),
  criado_em timestamptz not null default now(),
  editado_por uuid references auth.users(id), editado_em timestamptz,
  aprovado_por uuid references auth.users(id), aprovado_em timestamptz,
  motivo_rejeicao text,
  fechamento_id uuid references public.contrato_fechamentos(id) on delete set null
);
create index contrato_lancamentos_contrato_idx on public.contrato_lancamentos(contrato_id, mes_referencia);
create unique index contrato_lancamentos_numero_por_contrato on public.contrato_lancamentos(contrato_id, (tipo = 'VALE'), numero);
create table public.contrato_lancamento_itens (
  id uuid primary key default gen_random_uuid(),
  lancamento_id uuid not null references public.contrato_lancamentos(id) on delete cascade,
  item_id uuid not null references public.contrato_itens(id),
  modo text not null default 'QTD' check (modo in ('QTD','PCT')),
  percentual numeric,
  quantidade_medida numeric not null,
  quantidade_aprovada numeric,
  valor_unitario numeric not null,
  motivo_glosa text
);
create table public.contrato_vale_descontos (
  id uuid primary key default gen_random_uuid(),
  vale_id uuid not null references public.contrato_lancamentos(id) on delete cascade,
  fechamento_id uuid not null references public.contrato_fechamentos(id) on delete cascade,
  valor numeric not null
);
create table public.contrato_retencao_liberacoes (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  valor numeric not null,
  data date not null default current_date,
  observacao text,
  lancado_por uuid default auth.uid() references auth.users(id),
  criado_em timestamptz not null default now()
);
create table public.contrato_anexos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  aditivo_id uuid references public.contrato_aditivos(id) on delete set null,
  lancamento_id uuid references public.contrato_lancamentos(id) on delete cascade,
  solicitacao_id uuid references public.contrato_solicitacoes(id) on delete cascade,
  tipo text not null default 'CONTRATO' check (tipo in ('CONTRATO','ADITIVO','FOTO','OUTRO')),
  nome_arquivo text,
  storage_path text not null,
  enviado_por uuid default auth.uid() references auth.users(id),
  criado_em timestamptz not null default now()
);

-- ── Isolamento por construtora ────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['obras','pessoas','retencoes_pessoa','log_alteracoes_retencao','servicos',
    'empresas_terceirizadas','empresa_obra','fechamentos','lancamentos','retiradas_retido','log_auditoria',
    'contratos','contrato_itens','contrato_precos','contrato_retencoes','contrato_solicitacoes','contrato_aditivos',
    'contrato_fechamentos','contrato_lancamentos','contrato_lancamento_itens','contrato_vale_descontos',
    'contrato_retencao_liberacoes','contrato_anexos']
  loop
    execute format('alter table public.%I add column construtora_id uuid not null default public.minha_construtora() references public.construtoras(id) on delete cascade', t);
    execute format('create index %I on public.%I(construtora_id)', t || '_construtora_idx', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy isolamento_construtora on public.%I as restrictive for all to authenticated using (construtora_id = (select public.minha_construtora())) with check (construtora_id = (select public.minha_construtora()))', t);
  end loop;
end $$;

-- número de contrato é único dentro da construtora
alter table public.contratos add constraint contratos_numero_key unique (construtora_id, numero);

alter table public.configuracoes_notificacao enable row level security;
create policy isolamento_construtora on public.configuracoes_notificacao as restrictive for all to authenticated
  using (construtora_id = (select public.minha_construtora())) with check (construtora_id = (select public.minha_construtora()));
alter table public.notificacoes enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.solicitacoes_acesso enable row level security;

-- ── Funções de negócio e auditoria ────────────────────────────────────────
create or replace function public.fn_log_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.log_auditoria(tabela, acao, registro_id, dados_anteriores, dados_novos, feito_por, construtora_id)
  values (TG_TABLE_NAME, TG_OP,
    case when TG_OP = 'DELETE' then old.id else new.id end,
    case when TG_OP in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when TG_OP in ('UPDATE','INSERT') then to_jsonb(new) end,
    auth.uid(),
    case when TG_OP = 'DELETE' then old.construtora_id else new.construtora_id end);
  return coalesce(new, old);
end;
$$;

create or replace function public.fn_numero_lancamento_contrato()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext('contrato_lanc_' || new.contrato_id::text));
  select coalesce(max(numero), 0) + 1 into new.numero
    from public.contrato_lancamentos
   where contrato_id = new.contrato_id and (tipo = 'VALE') = (new.tipo = 'VALE');
  return new;
end;
$$;

create or replace function public.pode_editar_contrato_lancamento(lid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.eh_admin_aprovado(auth.uid()) or exists (
    select 1 from public.contrato_lancamentos
    where id = lid and criado_por = auth.uid() and status = 'PENDENTE'
      and construtora_id = public.minha_construtora());
$$;

create trigger trg_log_retencoes after insert or update or delete on public.retencoes_pessoa for each row execute function public.fn_log_auditoria();
create trigger trg_log_retiradas after insert or update or delete on public.retiradas_retido for each row execute function public.fn_log_auditoria();
create trigger trg_log_lancamentos after insert or update or delete on public.lancamentos for each row execute function public.fn_log_auditoria();
create trigger trg_log_fechamentos after insert or update or delete on public.fechamentos for each row execute function public.fn_log_auditoria();
create trigger trg_auditoria_contrato_lancamentos after insert or update or delete on public.contrato_lancamentos for each row execute function public.fn_log_auditoria();
create trigger trg_auditoria_contratos after insert or update or delete on public.contratos for each row execute function public.fn_log_auditoria();
create trigger trg_auditoria_contrato_itens after insert or update or delete on public.contrato_itens for each row execute function public.fn_log_auditoria();
create trigger trg_auditoria_contrato_retencoes after insert or update or delete on public.contrato_retencoes for each row execute function public.fn_log_auditoria();
create trigger trg_numero_lancamento_contrato before insert on public.contrato_lancamentos for each row execute function public.fn_numero_lancamento_contrato();

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ── Políticas de acesso (mesmas regras do sistema original) ───────────────
create policy admin_edita_config on public.configuracoes_notificacao for update to authenticated
  using ((select public.eh_admin_aprovado(auth.uid()))) with check ((select public.eh_admin_aprovado(auth.uid())));
create policy aprovados_leem_config on public.configuracoes_notificacao for select to authenticated
  using ((select public.eh_usuario_aprovado(auth.uid())));

create policy admin_gerencia on public.obras for all to authenticated using ((select public.eh_admin_aprovado(auth.uid()))) with check ((select public.eh_admin_aprovado(auth.uid())));
create policy aprovados_leem on public.obras for select to authenticated using ((select public.eh_usuario_aprovado(auth.uid())));

create policy admin_rh_fin_gerenciam on public.pessoas for all to authenticated
  using ((select public.tem_setor(array['ADMIN','RH','FINANCEIRO']))) with check ((select public.tem_setor(array['ADMIN','RH','FINANCEIRO'])));
create policy aprovados_leem on public.pessoas for select to authenticated using ((select public.eh_usuario_aprovado(auth.uid())));

create policy admin_gerencia on public.retencoes_pessoa for all to authenticated using ((select public.eh_admin_aprovado(auth.uid()))) with check ((select public.eh_admin_aprovado(auth.uid())));
create policy aprovados_leem on public.retencoes_pessoa for select to authenticated using ((select public.eh_usuario_aprovado(auth.uid())));

create policy admin_grava on public.log_alteracoes_retencao for insert to authenticated with check ((select public.eh_admin_aprovado(auth.uid())));
create policy aprovados_leem on public.log_alteracoes_retencao for select to authenticated using ((select public.eh_usuario_aprovado(auth.uid())));

create policy admin_gerencia on public.servicos for all to authenticated using ((select public.eh_admin_aprovado(auth.uid()))) with check ((select public.eh_admin_aprovado(auth.uid())));
create policy aprovados_leem on public.servicos for select to authenticated using ((select public.eh_usuario_aprovado(auth.uid())));

create policy admin_gerencia on public.empresas_terceirizadas for all to authenticated using ((select public.eh_admin_aprovado(auth.uid()))) with check ((select public.eh_admin_aprovado(auth.uid())));
create policy aprovados_leem on public.empresas_terceirizadas for select to authenticated using ((select public.eh_usuario_aprovado(auth.uid())));
create policy admin_gerencia on public.empresa_obra for all to authenticated using ((select public.eh_admin_aprovado(auth.uid()))) with check ((select public.eh_admin_aprovado(auth.uid())));
create policy aprovados_leem on public.empresa_obra for select to authenticated using ((select public.eh_usuario_aprovado(auth.uid())));

create policy admin_cria on public.fechamentos for insert to authenticated with check ((select public.eh_admin_aprovado(auth.uid())));
create policy admin_exclui on public.fechamentos for delete to authenticated using ((select public.eh_admin_aprovado(auth.uid())));
create policy aprovados_leem on public.fechamentos for select to authenticated using ((select public.eh_usuario_aprovado(auth.uid())));

create policy admin_gerencia on public.lancamentos for all to authenticated using ((select public.eh_admin_aprovado(auth.uid()))) with check ((select public.eh_admin_aprovado(auth.uid())));
create policy autor_edita_pendente on public.lancamentos for update to authenticated
  using (criado_por = (select auth.uid()) and status = 'PENDENTE') with check (criado_por = (select auth.uid()));
create policy autor_exclui_pendente on public.lancamentos for delete to authenticated using (criado_por = (select auth.uid()) and status = 'PENDENTE');
create policy aprovados_criam on public.lancamentos for insert to authenticated
  with check ((select public.eh_usuario_aprovado(auth.uid())) and criado_por = (select auth.uid()));
create policy aprovados_leem on public.lancamentos for select to authenticated using ((select public.eh_usuario_aprovado(auth.uid())));

create policy admin_fin_gerenciam on public.retiradas_retido for all to authenticated
  using ((select public.tem_setor(array['ADMIN','FINANCEIRO']))) with check ((select public.tem_setor(array['ADMIN','FINANCEIRO'])));
create policy aprovados_leem on public.retiradas_retido for select to authenticated using ((select public.eh_usuario_aprovado(auth.uid())));

create policy admin_le on public.log_auditoria for select to authenticated using ((select public.eh_admin_aprovado(auth.uid())));

create policy servico_insere on public.notificacoes for insert to service_role with check (true);
create policy servico_exclui on public.notificacoes for delete to service_role using (true);
create policy le_as_proprias on public.notificacoes for select to authenticated using (usuario_id = (select auth.uid()));
create policy atualiza_as_proprias on public.notificacoes for update to authenticated using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy gerencia_as_proprias on public.push_subscriptions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy gerencia_as_proprias on public.solicitacoes_acesso for all to authenticated using (perfil_id = (select auth.uid())) with check (perfil_id = (select auth.uid()));
create policy admin_le on public.solicitacoes_acesso for select to authenticated using ((select public.eh_admin_aprovado(auth.uid())) and exists (select 1 from public.perfis p where p.id = perfil_id));
create policy admin_resolve on public.solicitacoes_acesso for update to authenticated using ((select public.eh_admin_aprovado(auth.uid())) and exists (select 1 from public.perfis p where p.id = perfil_id));

do $$
declare t text;
begin
  -- admin gerencia tudo + aprovados leem
  foreach t in array array['contratos','contrato_itens','contrato_precos','contrato_retencoes','contrato_solicitacoes',
    'contrato_aditivos','contrato_fechamentos','contrato_lancamentos','contrato_vale_descontos','contrato_retencao_liberacoes']
  loop
    execute format('create policy admin_gerencia on public.%I for all to authenticated using ((select public.eh_admin_aprovado(auth.uid()))) with check ((select public.eh_admin_aprovado(auth.uid())))', t);
    execute format('create policy aprovados_leem on public.%I for select to authenticated using ((select public.eh_usuario_aprovado(auth.uid())))', t);
  end loop;
end $$;

create policy autor_exclui_pendente on public.contrato_lancamentos for delete to authenticated using (criado_por = (select auth.uid()) and status = 'PENDENTE');
create policy aprovados_criam on public.contrato_lancamentos for insert to authenticated
  with check ((select public.eh_usuario_aprovado(auth.uid())) and criado_por = (select auth.uid()) and status = 'PENDENTE');
create policy autor_edita_pendente on public.contrato_lancamentos for update to authenticated
  using (criado_por = (select auth.uid()) and status = 'PENDENTE') with check (criado_por = (select auth.uid()) and status = 'PENDENTE');

create policy autor_exclui_pendente on public.contrato_solicitacoes for delete to authenticated using (criado_por = (select auth.uid()) and status = 'AGUARDANDO');
create policy aprovados_criam on public.contrato_solicitacoes for insert to authenticated
  with check ((select public.eh_usuario_aprovado(auth.uid())) and criado_por = (select auth.uid()) and status = 'AGUARDANDO');

create policy escrita on public.contrato_lancamento_itens for all to authenticated
  using (public.pode_editar_contrato_lancamento(lancamento_id)) with check (public.pode_editar_contrato_lancamento(lancamento_id));
create policy aprovados_leem on public.contrato_lancamento_itens for select to authenticated using ((select public.eh_usuario_aprovado(auth.uid())));

create policy aprovados_leem on public.contrato_anexos for select to authenticated using ((select public.eh_usuario_aprovado(auth.uid())));
create policy aprovados_enviam on public.contrato_anexos for insert to authenticated
  with check ((select public.eh_usuario_aprovado(auth.uid())) and enviado_por = (select auth.uid())
              and (tipo = 'FOTO' or (select public.eh_admin_aprovado(auth.uid()))));
create policy admin_ou_autor_exclui on public.contrato_anexos for delete to authenticated
  using ((select public.eh_admin_aprovado(auth.uid())) or enviado_por = (select auth.uid()));

-- ── Arquivos (Storage): cada construtora numa pasta própria ───────────────
-- O caminho do arquivo deve começar com o id da construtora: "<construtora_id>/..."
insert into storage.buckets (id, name, public) values ('contratos','contratos', false), ('fechamentos-pdfs','fechamentos-pdfs', false)
on conflict (id) do nothing;

create policy axis_arquivos_le on storage.objects for select to authenticated
  using (bucket_id in ('contratos','fechamentos-pdfs') and (storage.foldername(name))[1] = public.minha_construtora()::text
         and public.eh_usuario_aprovado(auth.uid()));
create policy axis_arquivos_envia on storage.objects for insert to authenticated
  with check (bucket_id in ('contratos','fechamentos-pdfs') and (storage.foldername(name))[1] = public.minha_construtora()::text
              and public.eh_usuario_aprovado(auth.uid()));
create policy axis_arquivos_remove on storage.objects for delete to authenticated
  using (bucket_id in ('contratos','fechamentos-pdfs') and (storage.foldername(name))[1] = public.minha_construtora()::text
         and public.eh_usuario_aprovado(auth.uid()));

-- ── Em quais módulos cada obra aparece ────────────────────────────────────
-- Use esta view nas telas: filtre por em_andamento / operacional / pos_obra.
create or replace view public.obras_visibilidade with (security_invoker = true) as
select o.*,
  (o.status = 'EM_ANDAMENTO') as em_andamento,
  (o.status <> 'ENTREGUE' or o.data_entrega_real is null
     or current_date < (o.data_entrega_real + interval '4 months')::date) as operacional,
  (o.status in ('CONCLUIDA','ENTREGUE')) as pos_obra
from public.obras o;
