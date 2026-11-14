import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, perfilDaRequisicao } from "@/lib/auth/getCurrentUserProfile";
import { salvarObra, alterarSituacao } from "./actions";
import EnviarFoto from "./EnviarFoto";

export const metadata = { title: "Cadastro de Obras" };

const SITUACOES = [
  { id: "EM_ANDAMENTO", rotulo: "Em andamento" },
  { id: "CONCLUIDA", rotulo: "Concluídas" },
  { id: "ENTREGUE", rotulo: "Entregues" },
] as const;
const ROTULO: Record<string, string> = { EM_ANDAMENTO: "Em andamento", CONCLUIDA: "Concluída", ENTREGUE: "Entregue" };
const dataBR = (d?: string | null) => (d ? d.slice(0, 10).split("-").reverse().join("/") : "—");
const mais4Meses = (d: string) => {
  const x = new Date(d + "T12:00:00");
  x.setMonth(x.getMonth() + 4);
  return x.toISOString().slice(0, 10);
};
const campo = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-white";

export default async function ObrasPage({ searchParams }: { searchParams: { situacao?: string; editar?: string; nova?: string } }) {
  const supabase = createClient();
  const user = await getUsuarioAtual();
  const { data: perfil } = await perfilDaRequisicao(user!.id);
  const ehAdmin = perfil?.setor === "ADMIN";
  const situacao = SITUACOES.some((s) => s.id === searchParams.situacao) ? searchParams.situacao! : "EM_ANDAMENTO";

  const [{ data: obras }, { data: contagem }] = await Promise.all([
    supabase.from("obras").select("id, nome, endereco, cidade, data_inicio, data_entrega_prevista, status, data_conclusao, data_entrega_real, observacoes").eq("status", situacao).order("nome"),
    supabase.from("obras").select("status"),
  ]);
  const total = (s: string) => (contagem ?? []).filter((o) => o.status === s).length;
  const editando = searchParams.editar ? (obras ?? []).find((o) => o.id === searchParams.editar) : null;
  const mostrarForm = ehAdmin && (searchParams.nova === "1" || !!editando);
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink-900">Cadastro de Obras</h1>
          <p className="text-sm text-ink-500 mt-1">Obra concluída sai do Andamento. Obra entregue fica em medições e contratos por mais 4 meses e depois só em Vistoria e Pós-obra.</p>
        </div>
        {ehAdmin && !mostrarForm && (
          <Link href={`/obras?situacao=${situacao}&nova=1`} className="bg-primaryDark text-white rounded-lg px-4 min-h-[44px] inline-flex items-center text-sm font-semibold hover:opacity-90">+ Nova obra</Link>
        )}
      </div>

      {mostrarForm && (
        <form action={salvarObra} className="card space-y-4">
          <h2 className="font-semibold text-ink-900">{editando ? `Editar ${editando.nome}` : "Nova obra"}</h2>
          {editando && <input type="hidden" name="id" value={editando.id} />}
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm">Nome da obra<input name="nome" required defaultValue={editando?.nome ?? ""} className={campo + " mt-1"} /></label>
            <label className="text-sm">Cidade<input name="cidade" defaultValue={editando?.cidade ?? ""} className={campo + " mt-1"} /></label>
            <label className="text-sm sm:col-span-2">Endereço<input name="endereco" defaultValue={editando?.endereco ?? ""} className={campo + " mt-1"} /></label>
            <label className="text-sm">Início<input type="date" name="data_inicio" defaultValue={editando?.data_inicio ?? ""} className={campo + " mt-1"} /></label>
            <label className="text-sm">Entrega prevista<input type="date" name="data_entrega_prevista" defaultValue={editando?.data_entrega_prevista ?? ""} className={campo + " mt-1"} /></label>
            <label className="text-sm sm:col-span-2">Observações<textarea name="observacoes" rows={2} defaultValue={editando?.observacoes ?? ""} className={campo + " mt-1"} /></label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-primaryDark text-white rounded-lg px-5 min-h-[44px] text-sm font-semibold hover:opacity-90">Salvar</button>
            <Link href={`/obras?situacao=${situacao}`} className="border border-border rounded-lg px-5 min-h-[44px] inline-flex items-center text-sm">Cancelar</Link>
          </div>
        </form>
      )}

      <nav className="sbj-abas sem-marca" aria-label="Situação das obras">
        {SITUACOES.map((s) => (
          <Link key={s.id} href={`/obras?situacao=${s.id}`} className={"sbj-aba " + (s.id === situacao ? "ativa" : "")} aria-current={s.id === situacao ? "page" : undefined}>
            {s.rotulo} <span className="opacity-60 tabular-nums">{total(s.id)}</span>
          </Link>
        ))}
      </nav>

      {(obras ?? []).length === 0 ? (
        <div className="card text-sm text-ink-500">Nenhuma obra {ROTULO[situacao].toLowerCase()}.{ehAdmin && situacao === "EM_ANDAMENTO" ? " Clique em “+ Nova obra” para cadastrar a primeira." : ""}</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {(obras ?? []).map((o) => {
            const saiEm = o.status === "ENTREGUE" && o.data_entrega_real ? mais4Meses(o.data_entrega_real) : null;
            return (
              <article key={o.id} className="card space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg text-ink-900 truncate">{o.nome}</h2>
                    <p className="text-xs text-ink-500">{[o.endereco, o.cidade].filter(Boolean).join(" · ") || "Sem endereço"}</p>
                  </div>
                  <span className="badge bg-ink-100 text-ink-700">{ROTULO[o.status]}</span>
                </div>
                <dl className="grid grid-cols-2 gap-y-1 text-sm">
                  <dt className="text-ink-500">Início</dt><dd>{dataBR(o.data_inicio)}</dd>
                  <dt className="text-ink-500">Entrega prevista</dt><dd>{dataBR(o.data_entrega_prevista)}</dd>
                  {o.data_conclusao && (<><dt className="text-ink-500">Concluída em</dt><dd>{dataBR(o.data_conclusao)}</dd></>)}
                  {o.data_entrega_real && (<><dt className="text-ink-500">Entregue em</dt><dd>{dataBR(o.data_entrega_real)}</dd></>)}
                </dl>
                {saiEm && (
                  <p className="text-xs text-ink-600 bg-ink-100 rounded-lg px-3 py-2">
                    {saiEm > hoje ? `Continua em medições e contratos até ${dataBR(saiEm)}. Depois fica só em Vistoria e Pós-obra.` : "Já está só em Vistoria e Pós-obra."}
                  </p>
                )}
                {ehAdmin && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
                    <form action={alterarSituacao} className="flex flex-wrap items-center gap-2 pt-3">
                      <input type="hidden" name="id" value={o.id} />
                      <label className="sr-only" htmlFor={"st-" + o.id}>Situação</label>
                      <select id={"st-" + o.id} name="status" defaultValue={o.status} className="border border-border rounded-lg px-2 min-h-[36px] text-xs bg-white">
                        <option value="EM_ANDAMENTO">Em andamento</option>
                        <option value="CONCLUIDA">Concluída</option>
                        <option value="ENTREGUE">Entregue</option>
                      </select>
                      <label className="sr-only" htmlFor={"dt-" + o.id}>Data</label>
                      <input id={"dt-" + o.id} type="date" name="data" defaultValue={hoje} className="border border-border rounded-lg px-2 min-h-[36px] text-xs" />
                      <button type="submit" className="text-xs font-semibold bg-primaryDark text-white rounded-lg px-3 min-h-[36px]">Atualizar</button>
                    </form>
                    <div className="flex items-center gap-2 pt-3 ml-auto">
                      <EnviarFoto obraId={o.id} />
                      <Link href={`/obras?situacao=${situacao}&editar=${o.id}`} className="text-xs font-medium border border-border rounded-lg px-3 min-h-[36px] inline-flex items-center hover:border-ink-400">Editar</Link>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
