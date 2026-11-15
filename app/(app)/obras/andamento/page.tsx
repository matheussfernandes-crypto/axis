import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, perfilDaRequisicao } from "@/lib/auth/getCurrentUserProfile";
import { carregarAndamento } from "./dados";
import { apontarStatus } from "./actions";
import Grade from "./Grade";

export const metadata = { title: "Andamento de Obra" };

export default async function AndamentoObraPage({ searchParams }: { searchParams: { obra?: string; pav?: string } }) {
  const supabase = createClient();
  const user = await getUsuarioAtual();
  const { data: perfil } = await perfilDaRequisicao(user!.id);
  const ehAdmin = perfil?.setor === "ADMIN";
  const podeApontar = ehAdmin || perfil?.setor === "ESTAGIARIO";

  const { data: obras } = await supabase.from("obras_visibilidade").select("id, nome").eq("operacional", true).order("nome");
  const obraId = searchParams.obra || obras?.[0]?.id || null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink-900">Andamento de Obra</h1>
          <p className="text-sm text-ink-500 mt-1">% físico por pavimento, local e serviço, com peso por categoria.</p>
        </div>
        {ehAdmin && obraId && (
          <Link href={`/obras/andamento/configuracao?obra=${obraId}`} className="border border-border rounded-lg px-4 py-2 text-sm font-semibold hover:bg-surface-subtle">
            Configurar
          </Link>
        )}
      </div>

      <div className="card">
        <form method="get" className="flex gap-2">
          <select name="obra" defaultValue={obraId ?? ""} className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-white">
            {(obras ?? []).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
          <button className="bg-gray-200 rounded-lg px-4 py-2 text-sm font-semibold">Ver obra</button>
        </form>
      </div>

      {obraId && <Conteudo obraId={obraId} pavSelecionado={searchParams.pav} podeApontar={podeApontar} ehAdmin={ehAdmin} />}
    </div>
  );
}

async function Conteudo({
  obraId,
  pavSelecionado,
  podeApontar,
  ehAdmin,
}: {
  obraId: string;
  pavSelecionado?: string;
  podeApontar: boolean;
  ehAdmin: boolean;
}) {
  const dados = await carregarAndamento(obraId);
  const pav = pavSelecionado && dados.pavimentos.some((p) => p.id === pavSelecionado) ? pavSelecionado : dados.pavimentos[0]?.id;
  const locaisPav = dados.locais.filter((l) => l.pavimento_id === pav);

  const percObra = dados.percentuais.find((p: any) => p.nivel === "obra");
  const percPavimentos = dados.percentuais.filter((p: any) => p.nivel === "pavimento");
  const percCategorias = dados.percentuais.filter((p: any) => p.nivel === "categoria");

  if (!dados.pavimentos.length) {
    return (
      <div className="card text-sm text-ink-500">
        Nenhum pavimento cadastrado ainda nesta obra.
        {ehAdmin && (
          <>
            {" "}<Link href={`/obras/andamento/configuracao?obra=${obraId}`} className="text-primaryDark underline font-semibold">Configurar agora →</Link>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card">
          <span className="block text-xs text-ink-500">% ponderado da obra</span>
          <span className="font-display text-2xl text-ink-900">{Number(percObra?.pct ?? 0).toFixed(1)}%</span>
        </div>
        <div className="card">
          <span className="block text-xs text-ink-500">Finalizados</span>
          <span className="font-display text-2xl text-ink-900">{percObra?.fin ?? 0}</span>
        </div>
        <div className="card">
          <span className="block text-xs text-ink-500">Em andamento</span>
          <span className="font-display text-2xl text-ink-900">{percObra?.andam ?? 0}</span>
        </div>
        <div className="card">
          <span className="block text-xs text-ink-500">Não iniciados</span>
          <span className="font-display text-2xl text-ink-900">{percObra?.nao ?? 0}</span>
        </div>
      </div>

      {percCategorias.length > 0 && (
        <div className="card space-y-2">
          <span className="text-xs text-ink-500 uppercase tracking-wide">Por categoria</span>
          <div className="flex flex-wrap gap-4">
            {percCategorias.map((c: any) => (
              <span key={c.ref_id} className="text-sm">
                {c.nome}: <b>{Number(c.pct).toFixed(0)}%</b>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {dados.pavimentos.map((p) => {
          const pp = percPavimentos.find((x: any) => x.ref_id === p.id);
          return (
            <Link
              key={p.id}
              href={`/obras/andamento?obra=${obraId}&pav=${p.id}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold border ${p.id === pav ? "bg-primaryDark text-white border-primaryDark" : "bg-white text-ink-700 border-border hover:bg-surface-subtle"}`}
            >
              {p.nome} {pp ? `· ${Number(pp.pct).toFixed(0)}%` : ""}
            </Link>
          );
        })}
      </div>

      <div className="card">
        <Grade
          obraId={obraId}
          locais={locaisPav}
          servicos={dados.servicos}
          pesos={dados.pesos}
          apontamentos={dados.apontamentos as any}
          podeApontar={podeApontar}
          apontarStatus={apontarStatus}
        />
      </div>
    </>
  );
}
