import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, perfilDaRequisicao } from "@/lib/auth/getCurrentUserProfile";
import { redirect } from "next/navigation";
import FormAcao from "@/components/contratos/FormAcao";
import CampoPeso from "../CampoPeso";
import {
  salvarPavimento, excluirPavimento,
  salvarCategoria, excluirCategoria,
  salvarServico, excluirServico,
  salvarLocal, excluirLocal,
  definirPeso,
} from "../actions";

export const metadata = { title: "Configurar Andamento de Obra" };

const campo = "border border-border rounded-lg px-3 py-2 text-sm bg-white";

export default async function ConfiguracaoAndamentoPage({ searchParams }: { searchParams: { obra?: string } }) {
  const supabase = createClient();
  const user = await getUsuarioAtual();
  const { data: perfil } = await perfilDaRequisicao(user!.id);
  if (perfil?.setor !== "ADMIN") redirect("/obras/andamento");

  const { data: obras } = await supabase.from("obras_visibilidade").select("id, nome").eq("operacional", true).order("nome");
  const obraId = searchParams.obra || obras?.[0]?.id || null;

  if (!obraId) return <div className="card text-sm text-ink-500">Nenhuma obra cadastrada.</div>;

  const [{ data: pavimentos }, { data: locais }, { data: categorias }, { data: servicos }, { data: pesos }] = await Promise.all([
    supabase.from("an_pavimento").select("id, nome, ordem").eq("obra_id", obraId).order("ordem"),
    supabase.from("an_local").select("id, pavimento_id, nome, categoria_id").order("ordem"),
    supabase.from("an_categoria").select("id, nome, cor, ordem").eq("obra_id", obraId).order("ordem"),
    supabase.from("an_servico").select("id, nome, ordem").eq("obra_id", obraId).eq("arquivado", false).order("ordem"),
    (async () => {
      const { data: cats } = await supabase.from("an_categoria").select("id").eq("obra_id", obraId);
      if (!cats?.length) return { data: [] as any[] };
      return supabase.from("an_categoria_servico").select("categoria_id, servico_id, peso, peso_fixo").in("categoria_id", cats.map((c) => c.id));
    })(),
  ]);

  const pavimentoIds = new Set((pavimentos ?? []).map((p) => p.id));
  const locaisDaObra = (locais ?? []).filter((l) => pavimentoIds.has(l.pavimento_id));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-ink-900">Configurar Andamento de Obra</h1>
        <p className="text-sm text-ink-500 mt-1">Pavimentos, categorias, serviços (com peso) e locais. Só ADM.</p>
      </div>

      <div className="card">
        <form method="get" className="flex gap-2">
          <select name="obra" defaultValue={obraId} className={campo + " flex-1"}>
            {(obras ?? []).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
          <button className="bg-gray-200 rounded-lg px-4 py-2 text-sm font-semibold">Ver obra</button>
        </form>
      </div>

      {/* Categorias */}
      <section className="card space-y-3">
        <h2 className="font-semibold text-ink-900">Categorias</h2>
        <p className="text-xs text-ink-500">Tipo de local (ex.: Apartamento tipo, Cobertura, Área comum). Cada local pertence a uma categoria, que define os serviços e pesos dela.</p>
        <ul className="divide-y">
          {(categorias ?? []).map((c) => (
            <li key={c.id} className="py-2 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: c.cor }} />
              <span className="flex-1 text-sm">{c.nome}</span>
              <FormAcao action={excluirCategoria} mostrarOk={false} className="contents">
                <input type="hidden" name="id" value={c.id} />
                <button className="text-xs text-danger underline">Excluir</button>
              </FormAcao>
            </li>
          ))}
          {!categorias?.length && <li className="py-2 text-sm text-ink-400">Nenhuma categoria ainda.</li>}
        </ul>
        <FormAcao action={salvarCategoria} className="flex flex-wrap gap-2 items-end border-t pt-3">
          <input type="hidden" name="obraId" value={obraId} />
          <label className="flex-1 min-w-[180px] flex flex-col gap-1 text-xs text-ink-500">Nome<input name="nome" required className={campo} /></label>
          <label className="flex flex-col gap-1 text-xs text-ink-500">Cor<input type="color" name="cor" defaultValue="#2c6975" className="h-[38px] w-14 border border-border rounded-lg" /></label>
          <button className="bg-primaryDark text-white rounded-lg px-4 py-2 text-sm font-semibold">+ Adicionar</button>
        </FormAcao>
      </section>

      {/* Pavimentos */}
      <section className="card space-y-3">
        <h2 className="font-semibold text-ink-900">Pavimentos</h2>
        <ul className="divide-y">
          {(pavimentos ?? []).map((p) => (
            <li key={p.id} className="py-2 flex items-center gap-3">
              <span className="flex-1 text-sm">{p.nome}</span>
              <FormAcao action={excluirPavimento} mostrarOk={false} className="contents">
                <input type="hidden" name="id" value={p.id} />
                <button className="text-xs text-danger underline">Excluir</button>
              </FormAcao>
            </li>
          ))}
          {!pavimentos?.length && <li className="py-2 text-sm text-ink-400">Nenhum pavimento ainda.</li>}
        </ul>
        <FormAcao action={salvarPavimento} className="flex flex-wrap gap-2 items-end border-t pt-3">
          <input type="hidden" name="obraId" value={obraId} />
          <label className="flex-1 min-w-[180px] flex flex-col gap-1 text-xs text-ink-500">Nome<input name="nome" required placeholder="Ex.: 3º Pavimento" className={campo} /></label>
          <button className="bg-primaryDark text-white rounded-lg px-4 py-2 text-sm font-semibold">+ Adicionar</button>
        </FormAcao>
      </section>

      {/* Serviços e pesos */}
      <section className="card space-y-3">
        <h2 className="font-semibold text-ink-900">Serviços e pesos por categoria</h2>
        <p className="text-xs text-ink-500">O peso de cada categoria soma 100%. Mude um valor e os outros se reajustam sozinhos (exceto os que você já travou).</p>
        {categorias?.length ? (
          <div className="table-scroll">
            <table className="text-sm border-collapse w-full">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-3">Serviço</th>
                  {categorias.map((c) => <th key={c.id} className="py-2 px-2 text-right">{c.nome}</th>)}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(servicos ?? []).map((s) => (
                  <tr key={s.id} className="border-b border-border">
                    <td className="py-1.5 pr-3">{s.nome}</td>
                    {categorias.map((c) => {
                      const p = (pesos ?? []).find((x) => x.categoria_id === c.id && x.servico_id === s.id);
                      return (
                        <td key={c.id} className="py-1.5 px-2 text-right">
                          <CampoPeso categoriaId={c.id} servicoId={s.id} valor={Number(p?.peso ?? 0)} travado={!!p?.peso_fixo} definirPeso={definirPeso} />
                        </td>
                      );
                    })}
                    <td className="py-1.5 pl-2">
                      <FormAcao action={excluirServico} mostrarOk={false} className="contents">
                        <input type="hidden" name="id" value={s.id} />
                        <button className="text-xs text-danger underline">Excluir</button>
                      </FormAcao>
                    </td>
                  </tr>
                ))}
                {!servicos?.length && <tr><td colSpan={categorias.length + 2} className="py-3 text-center text-ink-400">Nenhum serviço ainda.</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-ink-400">Cadastre uma categoria primeiro.</p>
        )}
        <FormAcao action={salvarServico} className="flex flex-wrap gap-2 items-end border-t pt-3">
          <input type="hidden" name="obraId" value={obraId} />
          <label className="flex-1 min-w-[220px] flex flex-col gap-1 text-xs text-ink-500">Novo serviço<input name="nome" required placeholder="Ex.: Reboco Interno" className={campo} /></label>
          <button className="bg-primaryDark text-white rounded-lg px-4 py-2 text-sm font-semibold">+ Adicionar</button>
        </FormAcao>
      </section>

      {/* Locais */}
      <section className="card space-y-3">
        <h2 className="font-semibold text-ink-900">Locais</h2>
        {(pavimentos ?? []).map((p) => (
          <div key={p.id} className="border-t pt-3 first:border-t-0 first:pt-0 space-y-2">
            <h3 className="text-sm font-semibold text-ink-700">{p.nome}</h3>
            <ul className="divide-y">
              {locaisDaObra.filter((l) => l.pavimento_id === p.id).map((l) => (
                <li key={l.id} className="py-1.5 flex items-center gap-3 text-sm">
                  <span className="flex-1">{l.nome}</span>
                  <span className="text-xs text-ink-500">{categorias?.find((c) => c.id === l.categoria_id)?.nome}</span>
                  <FormAcao action={excluirLocal} mostrarOk={false} className="contents">
                    <input type="hidden" name="id" value={l.id} />
                    <button className="text-xs text-danger underline">Excluir</button>
                  </FormAcao>
                </li>
              ))}
              {!locaisDaObra.some((l) => l.pavimento_id === p.id) && <li className="py-1.5 text-sm text-ink-400">Nenhum local ainda.</li>}
            </ul>
            <FormAcao action={salvarLocal} className="flex flex-wrap gap-2 items-end">
              <input type="hidden" name="pavimentoId" value={p.id} />
              <label className="flex-1 min-w-[160px] flex flex-col gap-1 text-xs text-ink-500">Nome<input name="nome" required placeholder="Ex.: Apto 301" className={campo} /></label>
              <label className="flex flex-col gap-1 text-xs text-ink-500">Categoria
                <select name="categoriaId" required className={campo}>
                  {(categorias ?? []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </label>
              <button className="bg-primaryDark text-white rounded-lg px-4 py-2 text-sm font-semibold">+ Adicionar</button>
            </FormAcao>
          </div>
        ))}
        {!pavimentos?.length && <p className="text-sm text-ink-400">Cadastre um pavimento primeiro.</p>}
      </section>
    </div>
  );
}
