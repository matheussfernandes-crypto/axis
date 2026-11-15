import { createClient } from "@/lib/supabase/server";

export async function carregarAndamento(obraId: string) {
  const supabase = createClient();
  const [
    { data: pavimentos },
    { data: locais },
    { data: categorias },
    { data: servicos },
    { data: apontamentos },
    { data: percentuais },
  ] = await Promise.all([
    supabase.from("an_pavimento").select("id, nome, ordem").eq("obra_id", obraId).order("ordem"),
    supabase.from("an_local").select("id, pavimento_id, nome, categoria_id, ordem").order("ordem"),
    supabase.from("an_categoria").select("id, chave, nome, cor, ordem").eq("obra_id", obraId).order("ordem"),
    supabase.from("an_servico").select("id, nome, ordem, arquivado").eq("obra_id", obraId).eq("arquivado", false).order("ordem"),
    supabase.from("an_apontamento").select("local_id, servico_id, status, observacao").eq("obra_id", obraId),
    supabase.rpc("an_percentuais", { p_obra: obraId }),
  ]);

  const pavimentoIds = new Set((pavimentos ?? []).map((p) => p.id));
  const locaisDaObra = (locais ?? []).filter((l) => pavimentoIds.has(l.pavimento_id));

  const { data: pesos } = (categorias ?? []).length
    ? await supabase.from("an_categoria_servico").select("categoria_id, servico_id, peso, peso_fixo").in("categoria_id", (categorias ?? []).map((c) => c.id))
    : { data: [] as any[] };

  return {
    pavimentos: pavimentos ?? [],
    locais: locaisDaObra,
    categorias: categorias ?? [],
    servicos: servicos ?? [],
    pesos: pesos ?? [],
    apontamentos: apontamentos ?? [],
    percentuais: percentuais ?? [],
  };
}

export type DadosAndamento = Awaited<ReturnType<typeof carregarAndamento>>;
