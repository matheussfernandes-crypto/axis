"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function minhaConstrutoraComoAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");
  const { data: p } = await supabase.from("perfis").select("setor, status, construtora_id").eq("id", user.id).single();
  if (p?.setor !== "ADMIN" || p?.status !== "aprovado" || !p.construtora_id) throw new Error("Só o administrador altera os dados da construtora.");
  return { supabase, id: p.construtora_id as string };
}

export async function salvarDados(formData: FormData) {
  const { supabase, id } = await minhaConstrutoraComoAdmin();
  const nome = String(formData.get("nome") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").replace(/\D/g, "") || null;
  if (!nome) throw new Error("Informe o nome da construtora.");
  if (cnpj && cnpj.length !== 14) throw new Error("CNPJ inválido.");
  const { error } = await supabase.from("construtoras").update({ nome, cnpj }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/construtora");
}

// Chamado depois que o navegador enviou o PNG para logos/<construtora>/logo.png
export async function registrarLogo(caminho: string) {
  const { supabase, id } = await minhaConstrutoraComoAdmin();
  if (!caminho.startsWith(id + "/")) throw new Error("Caminho inválido.");
  const { error } = await supabase.from("construtoras").update({ logo_path: caminho, logo_atualizado_em: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/construtora");
}

export async function removerLogo() {
  const { supabase, id } = await minhaConstrutoraComoAdmin();
  const { data: c } = await supabase.from("construtoras").select("logo_path").eq("id", id).single();
  if (c?.logo_path) await supabase.storage.from("logos").remove([c.logo_path]);
  await supabase.from("construtoras").update({ logo_path: null, logo_atualizado_em: null }).eq("id", id);
  revalidatePath("/construtora");
}

// Gera um código de convite novo (o antigo deixa de funcionar)
export async function novoCodigoConvite() {
  const { supabase, id } = await minhaConstrutoraComoAdmin();
  const codigo = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
  const { error } = await supabase.from("construtoras").update({ codigo_convite: codigo }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/construtora");
}
