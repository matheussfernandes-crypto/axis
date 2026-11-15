"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

const COR_STATUS: Record<number, string> = { 0: "#e3e7e9", 1: "#f0a020", 2: "#24914f", 3: "#ffffff" };
const TXT_STATUS: Record<number, string> = { 0: "#4b5563", 1: "#3b2a00", 2: "#ffffff", 3: "#6b7280" };
const ROTULO_STATUS: Record<number, string> = { 0: "Não iniciado", 1: "Andamento", 2: "Finalizado", 3: "Ausência" };

type Local = { id: string; nome: string; categoria_id: string };
type Servico = { id: string; nome: string };
type Peso = { categoria_id: string; servico_id: string; peso: number };
type Apontamento = { local_id: string | null; servico_id: string; status: number; observacao: string | null };

export default function Grade({
  obraId,
  locais,
  servicos,
  pesos,
  apontamentos,
  podeApontar,
  apontarStatus,
}: {
  obraId: string;
  locais: Local[];
  servicos: Servico[];
  pesos: Peso[];
  apontamentos: Apontamento[];
  podeApontar: boolean;
  apontarStatus: (fd: FormData) => Promise<{ erro?: string; ok?: string }>;
}) {
  const router = useRouter();
  const [pendente, start] = useTransition();

  const temPeso = new Set(pesos.map((p) => `${p.categoria_id}:${p.servico_id}`));
  const statusMap = new Map(apontamentos.filter((a) => a.local_id).map((a) => [`${a.local_id}:${a.servico_id}`, a]));

  function clicar(local: Local, servico: Servico) {
    if (!podeApontar || pendente) return;
    const atual = statusMap.get(`${local.id}:${servico.id}`)?.status ?? 0;
    const proximo = ((atual + 1) % 4) as number;
    const fd = new FormData();
    fd.set("obraId", obraId);
    fd.set("status", String(proximo));
    fd.set("celulas", JSON.stringify([{ l: local.id, s: servico.id }]));
    start(async () => {
      await apontarStatus(fd);
      router.refresh();
    });
  }

  if (!locais.length) return <p className="text-sm text-ink-400">Nenhum local cadastrado neste pavimento ainda.</p>;
  if (!servicos.length) return <p className="text-sm text-ink-400">Nenhum serviço cadastrado nesta obra ainda.</p>;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3 text-xs text-ink-500">
        {[0, 1, 2, 3].map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-border inline-block" style={{ background: COR_STATUS[s] }} />
            {ROTULO_STATUS[s]}
          </span>
        ))}
      </div>
      <div className="table-scroll">
        <table className="text-sm border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white text-left py-2 pr-3 border-b border-border min-w-[140px]">Local</th>
              {servicos.map((s) => (
                <th key={s.id} className="py-2 px-1 border-b border-border font-medium text-ink-500" style={{ writingMode: "vertical-rl", maxHeight: 120 }}>
                  <span className="inline-block">{s.nome}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locais.map((l) => (
              <tr key={l.id}>
                <td className="sticky left-0 bg-white py-1 pr-3 border-b border-border whitespace-nowrap">{l.nome}</td>
                {servicos.map((s) => {
                  const aplicavel = temPeso.has(`${l.categoria_id}:${s.id}`);
                  if (!aplicavel) return <td key={s.id} className="border-b border-border text-center text-ink-300">—</td>;
                  const ap = statusMap.get(`${l.id}:${s.id}`);
                  const status = ap?.status ?? 0;
                  return (
                    <td key={s.id} className="border-b border-border p-0.5">
                      <button
                        type="button"
                        title={`${l.nome} · ${s.nome} · ${ROTULO_STATUS[status]}${ap?.observacao ? ` — ${ap.observacao}` : ""}`}
                        onClick={() => clicar(l, s)}
                        disabled={!podeApontar}
                        className="w-7 h-7 rounded border border-border/60 disabled:cursor-default"
                        style={{ background: COR_STATUS[status], color: TXT_STATUS[status] }}
                      >
                        {ap?.observacao ? "•" : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {podeApontar && <p className="text-xs text-ink-400">Clique numa célula pra avançar: não iniciado → andamento → finalizado → ausência → não iniciado.</p>}
    </div>
  );
}
