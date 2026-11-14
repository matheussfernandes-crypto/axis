"use server";

import { createClient } from "@/lib/supabase/server";
import { notificarAdmins } from "@/lib/push/send";
import { redirect } from "next/navigation";

const SETORES_EQUIPE = ["ESTAGIARIO", "ENGENHEIRO", "ARQUITETO", "MESTRE_GERAL", "RH", "FINANCEIRO", "ADMIN"];
const erro = (modo: string, msg: string) => redirect(`/cadastro?modo=${modo}&erro=${encodeURIComponent(msg)}`);

// Cria a conta da construtora: a pessoa vira o ADMIN dela (30 dias de teste).
export async function criarConstrutora(formData: FormData) {
  const nomeConstrutora = String(formData.get("nomeConstrutora") || "").trim();
  const cnpj = String(formData.get("cnpj") || "").replace(/\D/g, "");
  const nomeCompleto = String(formData.get("nomeCompleto") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const senha = String(formData.get("senha") || "");

  if (!nomeConstrutora || !nomeCompleto || !email) erro("nova", "Preencha todos os campos.");
  if (senha.length < 8) erro("nova", "A senha precisa ter pelo menos 8 caracteres.");
  if (cnpj && cnpj.length !== 14) erro("nova", "CNPJ inválido.");

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome_completo: nomeCompleto, nome_construtora: nomeConstrutora, cnpj } },
  });
  if (error) erro("nova", error.message);
  if (data.session) redirect("/dashboard");
  redirect(`/login?aviso=${encodeURIComponent("Conta criada! Confirme o e-mail que enviamos e depois entre.")}`);
}

// Entra numa construtora que já usa o Axis, com o código de convite. Fica aguardando o ADMIN aprovar.
export async function entrarNaEquipe(formData: FormData) {
  const codigo = String(formData.get("codigo") || "").trim().toUpperCase();
  const nomeCompleto = String(formData.get("nomeCompleto") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const senha = String(formData.get("senha") || "");
  const setor = String(formData.get("setor") || "");

  if (!codigo || !nomeCompleto || !email || !SETORES_EQUIPE.includes(setor)) erro("equipe", "Preencha todos os campos.");
  if (senha.length < 8) erro("equipe", "A senha precisa ter pelo menos 8 caracteres.");

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome_completo: nomeCompleto, setor, codigo_convite: codigo } },
  });
  if (error) erro("equipe", /convite/i.test(error.message) || /Database error/i.test(error.message) ? "Código de convite inválido." : error.message);

  notificarAdmins(
    { title: "Novo usuário aguardando aprovação", body: `${nomeCompleto} solicitou acesso.`, url: "/admin/aprovacoes" },
    { email }
  ).catch(() => null);
  redirect("/aguardando-aprovacao?novo=1");
}
