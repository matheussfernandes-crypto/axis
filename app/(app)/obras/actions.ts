"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const STATUS = ["EM_ANDAMENTO", "CONCLUIDA", "ENTREGUE"] as const;
type Status = (typeof STATUS)[number];

async function exigirAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");
  const { data: p } = await supabase.from("perfis").select("setor, status").eq("id", user.id).single();
  if (p?.setor !== "ADMIN" || p?.status !== "aprovado") throw new Error("Só o administrador cadastra e altera obras.");
  return supabase;
}

const txt = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim() || null;

export async function salvarObra(formData: FormData) {
  const supabase = await exigirAdmin();
  const id = txt(formData, "id");
  const nome = txt(formData, "nome");
  if (!nome) throw new Error("Informe o nome da obra.");
  const dados = {
    nome,
    endereco: txt(formData, "endereco"),
    cidade: txt(formData, "cidade"),
    data_inicio: txt(formData, "data_inicio"),
    data_entrega_prevista: txt(formData, "data_entrega_prevista"),
    observacoes: txt(formData, "observacoes"),
  };
  const { error } = id
    ? await supabase.from("obras").update(dados).eq("id", id)
    : await supabase.from("obras").insert(dados);
  if (error) throw new Error(error.message);
  revalidatePath("/obras");
  revalidatePath("/dashboard");
}

// Muda a situação da obra. Concluída: sai do Andamento. Entregue: 4 meses depois da entrega
// sai de medições e contratos e fica só em Vistoria e Pós-obra.
export async function alterarSituacao(formData: FormData) {
  const supabase = await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as Status;
  if (!id || !STATUS.includes(status)) throw new Error("Situação inválida.");
  const hoje = new Date().toISOString().slice(0, 10);
  const data = txt(formData, "data") ?? hoje;
  const mudanca: Record<string, unknown> = { status };
  if (status === "EM_ANDAMENTO") Object.assign(mudanca, { data_conclusao: null, data_entrega_real: null });
  if (status === "CONCLUIDA") Object.assign(mudanca, { data_conclusao: data, data_entrega_real: null });
  if (status === "ENTREGUE") Object.assign(mudanca, { data_entrega_real: data });
  const { error } = await supabase.from("obras").update(mudanca).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/obras");
  revalidatePath("/dashboard");
}

export async function registrarFotoObra(obraId: string, caminho: string, legenda: string | null) {
  const supabase = createClient();
  const { error } = await supabase.from("obra_fotos").insert({ obra_id: obraId, storage_path: caminho, legenda });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

// ─── Andamento de Obra (% físico por serviço/etapa) ────────────────────────

type Resultado = { erro?: string; ok?: string };

export async function salvarServicoAndamento(formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin();
    const obraId = String(formData.get("obraId") ?? "");
    const nome = txt(formData, "nome");
    if (!obraId || !nome) return { erro: "Informe o nome do serviço/etapa." };
    const { count } = await supabase
      .from("andamento_servicos")
      .select("id", { count: "exact", head: true })
      .eq("obra_id", obraId);
    const { error } = await supabase.from("andamento_servicos").insert({ obra_id: obraId, nome, ordem: count ?? 0 });
    if (error) return { erro: error.message };
    revalidatePath("/obras/andamento");
    revalidatePath("/dashboard");
    return { ok: "Serviço adicionado." };
  } catch (e: any) {
    return { erro: e.message ?? "Erro ao salvar." };
  }
}

/** Salva as % de vários serviços de uma vez (um botão "Salvar" pra tela toda). */
export async function salvarAndamentoLote(formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin();
    const { data: { user } } = await supabase.auth.getUser();
    let linhas: { id: string; percentual: number }[] = [];
    try {
      linhas = JSON.parse(String(formData.get("linhas") ?? "[]"));
    } catch {
      return { erro: "Dados inválidos." };
    }
    for (const l of linhas) {
      if (!l.id || Number.isNaN(l.percentual) || l.percentual < 0 || l.percentual > 100) {
        return { erro: "Percentual inválido (use de 0 a 100)." };
      }
    }
    for (const l of linhas) {
      const { error } = await supabase
        .from("andamento_servicos")
        .update({ percentual: l.percentual, atualizado_em: new Date().toISOString(), atualizado_por: user?.id ?? null })
        .eq("id", l.id);
      if (error) return { erro: error.message };
    }
    revalidatePath("/obras/andamento");
    revalidatePath("/dashboard");
    return { ok: "Andamento salvo." };
  } catch (e: any) {
    return { erro: e.message ?? "Erro ao salvar." };
  }
}

export async function excluirServicoAndamento(formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin();
    const id = String(formData.get("id") ?? "");
    if (!id) return { erro: "Serviço não encontrado." };
    const { error } = await supabase.from("andamento_servicos").delete().eq("id", id);
    if (error) return { erro: error.message };
    revalidatePath("/obras/andamento");
    revalidatePath("/dashboard");
    return { ok: "Serviço removido." };
  } catch (e: any) {
    return { erro: e.message ?? "Erro ao excluir." };
  }
}
