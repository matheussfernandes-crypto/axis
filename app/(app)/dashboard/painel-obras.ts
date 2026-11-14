import { createClient } from "@/lib/supabase/server";

export type ObraPainel = { id: string; nome: string; exibir: boolean };

// Resumo de uma obra em andamento para o carrossel da página inicial
export type ResumoObra = {
  obraId: string;
  nome: string;
  cidade: string | null;
  dataEntregaPrevista: string | null;
  medidoMes: number;      // medições aprovadas no mês (empreiteiros próprios + contratos)
  pendentes: number;      // lançamentos aguardando aprovação
  valesMes: number;       // vales aprovados no mês
  contratosAtivos: number;
  pessoasAtivas: number;
};

export type FotoPainel = { obraId: string; obraNome: string; url: string; dataFoto: string; legenda: string | null };

const mesAtual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export async function carregarPainelObras() {
  const supabase = createClient();
  const mes = mesAtual();

  const { data: obrasRows } = await supabase
    .from("obras")
    .select("id, nome, cidade, exibir_no_painel, data_entrega_prevista")
    .eq("status", "EM_ANDAMENTO")
    .order("nome");
  const obras: ObraPainel[] = (obrasRows ?? []).map((o: any) => ({ id: o.id, nome: o.nome, exibir: o.exibir_no_painel !== false }));
  const visiveis = (obrasRows ?? []).filter((o: any) => o.exibir_no_painel !== false);
  if (!visiveis.length) return { obras, resumos: [] as ResumoObra[], fotos: [] as FotoPainel[] };
  const ids = visiveis.map((o: any) => o.id);

  // tudo em paralelo: uma consulta por tabela, filtrada pelas obras do painel
  const [{ data: lanc }, { data: clanc }, { data: contratos }, { data: pessoas }, { data: fotosRows }] = await Promise.all([
    supabase.from("lancamentos").select("obra_id, tipo, status, total_reais, mes_referencia").in("obra_id", ids).eq("mes_referencia", mes),
    supabase.from("contrato_lancamentos").select("status, tipo, valor_bruto, valor_vale, contratos!inner(obra_id)").eq("mes_referencia", mes).in("contratos.obra_id", ids),
    supabase.from("contratos").select("obra_id").in("obra_id", ids).eq("status", "ATIVO"),
    supabase.from("pessoas").select("obra_id").in("obra_id", ids).eq("status", "ATIVO"),
    supabase.from("obra_fotos").select("obra_id, data_foto, legenda, storage_path, criado_em").in("obra_id", ids)
      .order("data_foto", { ascending: false }).order("criado_em", { ascending: false }).limit(200),
  ]);

  const resumos: ResumoObra[] = visiveis.map((o: any) => {
    const l = (lanc ?? []).filter((x: any) => x.obra_id === o.id);
    const c = (clanc ?? []).filter((x: any) => x.contratos?.obra_id === o.id);
    const soma = (arr: any[], campo: string) => arr.reduce((t, x) => t + Number(x[campo] ?? 0), 0);
    return {
      obraId: o.id,
      nome: o.nome,
      cidade: o.cidade ?? null,
      dataEntregaPrevista: o.data_entrega_prevista ?? null,
      medidoMes:
        soma(l.filter((x: any) => x.status === "APROVADO" && x.tipo !== "VALE"), "total_reais") +
        soma(c.filter((x: any) => x.status === "APROVADO" && x.tipo !== "VALE" && x.tipo !== "DESCONTO"), "valor_bruto"),
      valesMes:
        soma(l.filter((x: any) => x.status === "APROVADO" && x.tipo === "VALE"), "total_reais") +
        soma(c.filter((x: any) => x.status === "APROVADO" && x.tipo === "VALE"), "valor_vale"),
      pendentes: l.filter((x: any) => x.status === "PENDENTE").length + c.filter((x: any) => x.status === "PENDENTE").length,
      contratosAtivos: (contratos ?? []).filter((x: any) => x.obra_id === o.id).length,
      pessoasAtivas: (pessoas ?? []).filter((x: any) => x.obra_id === o.id).length,
    };
  });

  // até 8 fotos mais recentes por obra
  const maisRecentes: any[] = [];
  for (const id of ids) maisRecentes.push(...(fotosRows ?? []).filter((f: any) => f.obra_id === id).slice(0, 8));
  const caminhos = maisRecentes.map((f) => f.storage_path);
  const { data: assinadas } = caminhos.length
    ? await supabase.storage.from("obra-fotos").createSignedUrls(caminhos, 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const url = new Map((assinadas ?? []).map((x) => [x.path, x.signedUrl]));
  const nome = new Map(visiveis.map((o: any) => [o.id, o.nome]));
  const fotos: FotoPainel[] = maisRecentes
    .filter((f) => url.get(f.storage_path))
    .map((f) => ({ obraId: f.obra_id, obraNome: nome.get(f.obra_id) ?? "", url: url.get(f.storage_path)!, dataFoto: f.data_foto, legenda: f.legenda }));

  return { obras, resumos, fotos };
}
