import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, perfilDaRequisicao } from "@/lib/auth/getCurrentUserProfile";
import { itensLiberados } from "@/lib/acessos/modulos";

/** Pode usar Arquitetura: ADMIN aprovado ou quem recebeu o módulo em Acessos (o banco confere de novo). */
export function podeArquitetura(perfil: { setor?: string | null; status?: string | null; acessos?: string[] | null } | null | undefined) {
  if (perfil?.status !== "aprovado") return false;
  if (perfil.setor === "ADMIN") return true;
  const lib = itensLiberados(perfil.acessos ?? []);
  return lib.has("arquitetura/especificacoes") || lib.has("arquitetura/catalogo");
}

/** Páginas de Arquitetura: quem não pode volta para o painel. */
export async function exigirArquiteturaPagina() {
  const user = await getUsuarioAtual();
  if (!user) redirect("/login");
  const { data: perfil } = await perfilDaRequisicao(user.id);
  if (!podeArquitetura(perfil as any)) redirect("/dashboard");
  return createClient();
}
