import { exigirArquiteturaPagina } from "../acesso";
import ListaProjetos, { type ProjetoResumo } from "./ListaProjetos";

export const dynamic = "force-dynamic";

// Arquitetura › Especificações: lista dos projetos (unidades/clientes da arquitetura).
export default async function EspecificacoesPage() {
  const supabase = await exigirArquiteturaPagina();
  const [{ data: projetos }, { data: itens }, { data: obras }] = await Promise.all([
    supabase.from("esp_projetos").select("id, codigo, titulo, cliente, obra_id, unidade, atualizado_em").order("codigo", { ascending: false, nullsFirst: false }),
    supabase.from("esp_itens").select("projeto_id, grupo"),
    supabase.from("obras").select("id, nome").order("nome"),
  ]);
  const conta: Record<string, Record<string, number>> = {};
  for (const i of itens ?? []) {
    const c = (conta[i.projeto_id] ??= {});
    c[i.grupo] = (c[i.grupo] ?? 0) + 1;
  }
  const nomes = new Map((obras ?? []).map((o) => [o.id, o.nome]));
  const lista: ProjetoResumo[] = (projetos ?? []).map((p) => ({ ...p, qtd: conta[p.id] ?? {}, obra: p.obra_id ? nomes.get(p.obra_id) ?? null : null }));
  return <ListaProjetos projetos={lista} obras={obras ?? []} />;
}
