revoke execute on function public.eh_admin_aprovado(uuid), public.eh_axis_admin(), public.eh_estagiario_ou_admin_aprovado(uuid),
  public.eh_usuario_aprovado(uuid), public.fn_log_auditoria(), public.fn_numero_lancamento_contrato(), public.handle_new_user(),
  public.minha_construtora(), public.nomes_perfis(uuid[]), public.pode_editar_contrato_lancamento(uuid),
  public.protege_campos_perfil(), public.tem_setor(text[]) from public, anon;
revoke execute on function public.fn_log_auditoria(), public.fn_numero_lancamento_contrato(), public.handle_new_user(),
  public.protege_campos_perfil() from authenticated;
alter default privileges in schema public revoke execute on functions from public, anon;
