-- AXIS · 10 · Painel do dono do Axis: ver todas as empresas, aprovar/suspender e "entrar" em uma delas.
-- Quem está em axis_admins pode escolher uma empresa ativa (construtora_ativa); a partir daí
-- minha_construtora() devolve essa empresa e todo o site (RLS, fotos, PDFs) passa a mostrar os dados dela.
-- Para os demais usuários nada muda.

alter table public.axis_admins add column if not exists construtora_ativa uuid references public.construtoras(id) on delete set null;

-- Empresa nova pode ficar aguardando o aceite do dono do Axis
alter table public.construtoras drop constraint if exists construtoras_plano_check;
alter table public.construtoras add constraint construtoras_plano_check check (plano in ('PENDENTE','TESTE','ATIVO','SUSPENSO','CANCELADO'));

create or replace function public.minha_construtora()
returns uuid language sql stable security definer set search_path = public as $$
  select coalesce(
    (select a.construtora_ativa from public.axis_admins a where a.user_id = auth.uid()),
    (select construtora_id from public.perfis where id = auth.uid())
  );
$$;

-- Situação da empresa que a pessoa está vendo agora (para o aviso no topo e o bloqueio de empresa pendente/suspensa)
create or replace function public.empresa_situacao()
returns table(empresa_id uuid, empresa_nome text, plano text, teste_ate date, eh_axis_admin boolean, propria_id uuid, propria_nome text)
language sql stable security definer set search_path = public as $$
  select c.id, c.nome, c.plano, c.teste_ate, public.eh_axis_admin(), p.construtora_id, cp.nome
  from public.perfis p
  join public.construtoras cp on cp.id = p.construtora_id
  join public.construtoras c on c.id = public.minha_construtora()
  where p.id = auth.uid();
$$;

-- Lista de todas as empresas (só o dono do Axis)
create or replace function public.plataforma_empresas()
returns table(id uuid, nome text, cnpj text, plano text, teste_ate date, criado_em timestamptz,
              usuarios bigint, pendentes bigint, admin_nome text, admin_email text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.eh_axis_admin() then raise exception 'Sem permissão.'; end if;
  return query
    select c.id, c.nome, c.cnpj, c.plano, c.teste_ate, c.criado_em,
           (select count(*) from public.perfis p where p.construtora_id = c.id and p.status = 'aprovado'),
           (select count(*) from public.perfis p where p.construtora_id = c.id and p.status = 'pendente'),
           (select p.nome_completo from public.perfis p where p.construtora_id = c.id and p.setor = 'ADMIN' order by p.criado_em limit 1),
           (select p.email from public.perfis p where p.construtora_id = c.id and p.setor = 'ADMIN' order by p.criado_em limit 1)
    from public.construtoras c
    order by (c.plano = 'PENDENTE') desc, c.criado_em desc;
end;
$$;

-- Entrar numa empresa (null = voltar para a própria)
create or replace function public.plataforma_entrar(p_construtora uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.eh_axis_admin() then raise exception 'Sem permissão.'; end if;
  if p_construtora is not null and not exists (select 1 from public.construtoras where id = p_construtora) then
    raise exception 'Empresa não encontrada.';
  end if;
  update public.axis_admins
     set construtora_ativa = case when p_construtora = (select construtora_id from public.perfis where id = auth.uid()) then null else p_construtora end
   where user_id = auth.uid();
end;
$$;

-- Aprovar / suspender / reativar / ativar plano / recusar
create or replace function public.plataforma_definir_plano(p_construtora uuid, p_plano text, p_dias_teste int default 30)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.eh_axis_admin() then raise exception 'Sem permissão.'; end if;
  if p_plano not in ('PENDENTE','TESTE','ATIVO','SUSPENSO','CANCELADO') then raise exception 'Plano inválido.'; end if;
  update public.construtoras
     set plano = p_plano,
         teste_ate = case when p_plano = 'TESTE' then current_date + greatest(coalesce(p_dias_teste, 30), 1) else teste_ate end
   where id = p_construtora;
end;
$$;

revoke all on function public.plataforma_empresas() from public, anon;
revoke all on function public.plataforma_entrar(uuid) from public, anon;
revoke all on function public.plataforma_definir_plano(uuid, text, int) from public, anon;
revoke all on function public.empresa_situacao() from public, anon;
grant execute on function public.plataforma_empresas() to authenticated;
grant execute on function public.plataforma_entrar(uuid) to authenticated;
grant execute on function public.plataforma_definir_plano(uuid, text, int) to authenticated;
grant execute on function public.empresa_situacao() to authenticated;
