"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Resultado = { erro?: string; ok?: string; id?: string };

async function exigirAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");
  const { data: p } = await supabase.from("perfis").select("setor, status").eq("id", user.id).single();
  if (p?.setor !== "ADMIN" || p?.status !== "aprovado") throw new Error("Só o administrador configura o Andamento de Obra.");
  return supabase;
}

const txt = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
function revalidarTudo() {
  revalidatePath("/obras/andamento");
  revalidatePath("/obras/andamento/configuracao");
  revalidatePath("/dashboard");
}

// ─── Apontamento (estagiário e ADM) ─────────────────────────────────────────

export async function apontarStatus(formData: FormData): Promise<Resultado> {
  try {
    const supabase = createClient();
    const obraId = txt(formData, "obraId");
    const status = Number(formData.get("status"));
    let celulas: { l: string; s: string }[] = [];
    try {
      celulas = JSON.parse(txt(formData, "celulas") || "[]");
    } catch {
      return { erro: "Dados inválidos." };
    }
    if (!obraId || !celulas.length || Number.isNaN(status)) return { erro: "Nada selecionado." };
    const { error } = await supabase.rpc("an_apontar", { p_obra: obraId, p_celulas: celulas, p_status: status });
    if (error) return { erro: error.message };
    revalidatePath("/obras/andamento");
    revalidatePath("/dashboard");
    return { ok: "Salvo." };
  } catch (e: any) {
    return { erro: e.message ?? "Erro ao salvar." };
  }
}

export async function salvarObservacao(formData: FormData): Promise<Resultado> {
  try {
    const supabase = createClient();
    const obraId = txt(formData, "obraId");
    const localId = txt(formData, "localId");
    const servicoId = txt(formData, "servicoId");
    const texto = txt(formData, "texto");
    const { error } = await supabase.rpc("an_observacao", { p_obra: obraId, p_local: localId, p_servico: servicoId, p_texto: texto });
    if (error) return { erro: error.message };
    revalidatePath("/obras/andamento");
    return { ok: "Observação salva." };
  } catch (e: any) {
    return { erro: e.message ?? "Erro ao salvar." };
  }
}

// ─── Configuração (só ADM) ──────────────────────────────────────────────────

export async function salvarPavimento(formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin();
    const obraId = txt(formData, "obraId");
    const nome = txt(formData, "nome");
    if (!obraId || !nome) return { erro: "Informe o nome do pavimento." };
    const { count } = await supabase.from("an_pavimento").select("id", { count: "exact", head: true }).eq("obra_id", obraId);
    const { error } = await supabase.from("an_pavimento").insert({ obra_id: obraId, nome, ordem: count ?? 0 });
    if (error) return { erro: error.message };
    revalidarTudo();
    return { ok: "Pavimento criado." };
  } catch (e: any) {
    return { erro: e.message ?? "Erro ao salvar." };
  }
}

export async function excluirPavimento(formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin();
    const id = txt(formData, "id");
    const { error } = await supabase.from("an_pavimento").delete().eq("id", id);
    if (error) return { erro: error.message };
    revalidarTudo();
    return { ok: "Pavimento removido." };
  } catch (e: any) {
    return { erro: e.message ?? "Erro ao excluir." };
  }
}

export async function salvarCategoria(formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin();
    const obraId = txt(formData, "obraId");
    const nome = txt(formData, "nome");
    const cor = txt(formData, "cor") || "#2c6975";
    if (!obraId || !nome) return { erro: "Informe o nome da categoria." };
    const chave = nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error } = await supabase.from("an_categoria").insert({ obra_id: obraId, nome, chave, cor });
    if (error) return { erro: error.message };
    revalidarTudo();
    return { ok: "Categoria criada." };
  } catch (e: any) {
    return { erro: e.message ?? "Erro ao salvar." };
  }
}

export async function excluirCategoria(formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin();
    const id = txt(formData, "id");
    const { error } = await supabase.from("an_categoria").delete().eq("id", id);
    if (error) return { erro: error.message };
    revalidarTudo();
    return { ok: "Categoria removida." };
  } catch (e: any) {
    return { erro: e.message ?? "Erro ao excluir." };
  }
}

export async function salvarServico(formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin();
    const obraId = txt(formData, "obraId");
    const nome = txt(formData, "nome");
    if (!obraId || !nome) return { erro: "Informe o nome do serviço." };
    const { count } = await supabase.from("an_servico").select("id", { count: "exact", head: true }).eq("obra_id", obraId);
    const { data: servico, error } = await supabase.from("an_servico").insert({ obra_id: obraId, nome, ordem: count ?? 0 }).select("id").single();
    if (error || !servico) return { erro: error?.message ?? "Erro ao salvar." };
    // vincula o serviço novo a todas as categorias da obra, com peso 0 (o ADM ajusta depois)
    const { data: categorias } = await supabase.from("an_categoria").select("id").eq("obra_id", obraId);
    if (categorias?.length) {
      await supabase.from("an_categoria_servico").insert(categorias.map((c) => ({ categoria_id: c.id, servico_id: servico.id, peso: 0 })));
      for (const c of categorias) await supabase.rpc("an_normalizar_pesos", { p_cat: c.id });
    }
    revalidarTudo();
    return { ok: "Serviço criado." };
  } catch (e: any) {
    return { erro: e.message ?? "Erro ao salvar." };
  }
}

export async function excluirServico(formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin();
    const id = txt(formData, "id");
    const { error } = await supabase.from("an_servico").delete().eq("id", id);
    if (error) return { erro: error.message };
    revalidarTudo();
    return { ok: "Serviço removido." };
  } catch (e: any) {
    return { erro: e.message ?? "Erro ao excluir." };
  }
}

export async function definirPeso(formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin();
    const categoriaId = txt(formData, "categoriaId");
    const servicoId = txt(formData, "servicoId");
    const valor = Number(String(formData.get("valor") ?? "0").replace(",", "."));
    if (!categoriaId || !servicoId || Number.isNaN(valor)) return { erro: "Peso inválido." };
    const { error } = await supabase.rpc("an_definir_peso", { p_cat: categoriaId, p_serv: servicoId, p_valor: valor });
    if (error) return { erro: error.message };
    revalidarTudo();
    return { ok: "Peso ajustado." };
  } catch (e: any) {
    return { erro: e.message ?? "Erro ao salvar." };
  }
}

export async function salvarLocal(formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin();
    const pavimentoId = txt(formData, "pavimentoId");
    const categoriaId = txt(formData, "categoriaId");
    const nome = txt(formData, "nome");
    if (!pavimentoId || !categoriaId || !nome) return { erro: "Informe o nome e a categoria do local." };
    const { count } = await supabase.from("an_local").select("id", { count: "exact", head: true }).eq("pavimento_id", pavimentoId);
    const { error } = await supabase.from("an_local").insert({ pavimento_id: pavimentoId, categoria_id: categoriaId, nome, ordem: count ?? 0 });
    if (error) return { erro: error.message };
    revalidarTudo();
    return { ok: "Local criado." };
  } catch (e: any) {
    return { erro: e.message ?? "Erro ao salvar." };
  }
}

export async function excluirLocal(formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin();
    const id = txt(formData, "id");
    const { error } = await supabase.from("an_local").delete().eq("id", id);
    if (error) return { erro: error.message };
    revalidarTudo();
    return { ok: "Local removido." };
  } catch (e: any) {
    return { erro: e.message ?? "Erro ao excluir." };
  }
}
