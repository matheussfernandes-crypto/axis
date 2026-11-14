import { itensLiberados } from "@/lib/acessos/modulos";

// Agenda da página inicial: cada pessoa vê só os compromissos dos setores a que tem acesso.
export type EventoAgenda = { data: string; label: string };

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export async function agendaDoSetor(supabase: any, _email: string | null | undefined, acessos: string[] | null | undefined, setor?: string | null): Promise<EventoAgenda[]> {
  const livres = itensLiberados(acessos ?? []);
  const tem = (chave: string) => setor === "ADMIN" || livres.has(chave);
  const hoje = new Date();
  const eventos: EventoAgenda[] = [];

  // Medições e vales: fechamento mensal no dia 21
  if (tem("contratos/fechamento") || tem("lancamentos")) {
    eventos.push({ data: iso(new Date(hoje.getFullYear(), hoje.getMonth(), 21)), label: "Fechamento mensal (dia 21)" });
  }

  // Entregas previstas de obras em andamento neste mês e no próximo
  try {
    const fim = iso(new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0));
    const ini = iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
    const { data: obras } = await supabase.from("obras").select("nome, data_entrega_prevista").eq("status", "EM_ANDAMENTO").gte("data_entrega_prevista", ini).lte("data_entrega_prevista", fim);
    for (const o of obras ?? []) eventos.push({ data: o.data_entrega_prevista, label: `Entrega prevista — ${o.nome}` });
  } catch {}

  return eventos.sort((a, b) => a.data.localeCompare(b.data) || a.label.localeCompare(b.label));
}
