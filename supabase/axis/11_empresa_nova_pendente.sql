-- AXIS · 11 · Empresa nova cadastrada fica PENDENTE até o dono do Axis aprovar (Empresas do Axis).
-- Aplicar junto com a publicação do painel (antes disso não haveria onde aprovar).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_construtora uuid;
  v_codigo text := upper(trim(coalesce(new.raw_user_meta_data->>'codigo_convite', '')));
  v_nome_construtora text := trim(coalesce(new.raw_user_meta_data->>'nome_construtora', ''));
begin
  if v_nome_construtora <> '' then
    insert into public.construtoras (nome, cnpj, plano, teste_ate)
    values (v_nome_construtora, nullif(trim(coalesce(new.raw_user_meta_data->>'cnpj','')), ''), 'PENDENTE', null)
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
