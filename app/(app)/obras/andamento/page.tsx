import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, perfilDaRequisicao } from "@/lib/auth/getCurrentUserProfile";
import { salvarServicoAndamento, excluirServicoAndamento, salvarAndamentoLote } from "../actions";
import FormAcao from "@/components/contratos/FormAcao";
import AndamentoForm from "./AndamentoForm";

export const metadata = { title: "Andamento de Obra" };

export default async function AndamentoObraPage({ searchParams }: { searchParams: { obra?: string } }) {
  const supabase = createClient();
  const user = await getUsuarioAtual();
  const { data: perfil } = await perfilDaRequisicao(user!.id);
  const ehAdmin = perfil?.setor === "ADMIN";

  const { data: obras } = await supabase
    .from("obras_visibilidade")
    .select("id, nome")
    .eq("operacional", true)
    .order("nome");
  const obraId = searchParams.obra || obras?.[0]?.id || null;

  const { data: servicos } = obraId
    ? await supabase
        .from("andamento_servicos")
        .select("id, nome, percentual, ordem")
        .eq("obra_id", obraId)
        .order("ordem")
    : { data: [] as any[] };

  const lista = servicos ?? [];
  const concluidos = lista.filter((s) => Number(s.percentual) >= 100).length;
  const naoIniciados = lista.filter((s) => Number(s.percentual) <= 0).length;
  const emAndamento = lista.length - concluidos - naoIniciados;
  const media = lista.length ? lista.reduce((s, x) => s + Number(x.percentual), 0) / lista.length : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-ink-900">Andamento de Obra</h1>
        <p className="text-sm text-ink-500 mt-1">% físico de cada etapa/serviço da obra — cadastro próprio da sua construtora.</p>
      </div>

      <div className="card">
        <form method="get" className="flex gap-2">
          <select name="obra" defaultValue={obraId ?? ""} className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-white">
            {(obras ?? []).map((o) => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
          <button className="bg-gray-200 rounded-lg px-4 py-2 text-sm font-semibold">Ver obra</button>
        </form>
      </div>

      {obraId && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card">
              <span className="block text-xs text-ink-500">Média geral</span>
              <span className="font-display text-2xl text-ink-900">{media.toFixed(0)}%</span>
            </div>
            <div className="card">
              <span className="block text-xs text-ink-500">Concluídos</span>
              <span className="font-display text-2xl text-ink-900">{concluidos}</span>
            </div>
            <div className="card">
              <span className="block text-xs text-ink-500">Em andamento</span>
              <span className="font-display text-2xl text-ink-900">{emAndamento}</span>
            </div>
            <div className="card">
              <span className="block text-xs text-ink-500">Não iniciados</span>
              <span className="font-display text-2xl text-ink-900">{naoIniciados}</span>
            </div>
          </div>

          <div className="card">
            {lista.length ? (
              <AndamentoForm
                servicos={lista.map((s) => ({ id: s.id, nome: s.nome, percentual: Number(s.percentual) }))}
                ehAdmin={ehAdmin}
                salvarAndamentoLote={salvarAndamentoLote}
                excluirServicoAndamento={excluirServicoAndamento}
              />
            ) : (
              <p className="text-sm text-ink-400">Nenhum serviço/etapa cadastrado nesta obra ainda.</p>
            )}
          </div>

          {ehAdmin && (
            <FormAcao action={salvarServicoAndamento} className="card flex flex-wrap gap-2 items-end">
              <input type="hidden" name="obraId" value={obraId} />
              <label className="flex-1 min-w-[220px] flex flex-col gap-1 text-xs text-ink-500">
                Novo serviço/etapa
                <input name="nome" required placeholder="Ex.: 10. Reboco Interno" className="border border-border rounded-lg px-3 py-2 text-sm bg-white" />
              </label>
              <button className="bg-primaryDark text-white rounded-lg px-4 py-2 text-sm font-semibold">+ Adicionar</button>
            </FormAcao>
          )}
        </>
      )}
    </div>
  );
}
