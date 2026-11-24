"use server";

// Ações do dono do Axis (quem está em axis_admins). O banco confere de novo em cada função.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PLANOS = ["PENDENTE", "TESTE", "ATIVO", "SUSPENSO", "CANCELADO"] as const;

/** Entra no site de uma empresa (null = volta para a própria). */
export async function entrarNaEmpresa(id: string | null) {
  const supabase = createClient();
  const { error } = await supabase.rpc("plataforma_entrar", { p_construtora: id });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

/** Aceitar (TESTE com 30 dias), ativar plano, suspender, reativar ou recusar uma empresa. */
export async function definirPlano(id: string, plano: string, diasTeste = 30) {
  if (!PLANOS.includes(plano as any)) throw new Error("Plano inválido.");
  const supabase = createClient();
  const { error } = await supabase.rpc("plataforma_definir_plano", { p_construtora: id, p_plano: plano, p_dias_teste: diasTeste });
  if (error) throw new Error(error.message);
  revalidatePath("/plataforma");
}
