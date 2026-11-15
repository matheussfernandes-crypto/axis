"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import FormAcao from "@/components/contratos/FormAcao";

type Servico = { id: string; nome: string; percentual: number };
type Resultado = { erro?: string; ok?: string };

export default function AndamentoForm({
  servicos,
  ehAdmin,
  salvarAndamentoLote,
  excluirServicoAndamento,
}: {
  servicos: Servico[];
  ehAdmin: boolean;
  salvarAndamentoLote: (fd: FormData) => Promise<Resultado>;
  excluirServicoAndamento: (fd: FormData) => Promise<Resultado>;
}) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(servicos.map((s) => [s.id, String(s.percentual)]))
  );
  const [msg, setMsg] = useState<Resultado | null>(null);
  const [pendente, start] = useTransition();

  function salvar() {
    setMsg(null);
    const fd = new FormData();
    fd.set(
      "linhas",
      JSON.stringify(servicos.map((s) => ({ id: s.id, percentual: Number(valores[s.id] ?? s.percentual) })))
    );
    start(async () => {
      const r = await salvarAndamentoLote(fd);
      setMsg(r);
      if (!r.erro) router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {servicos.map((s) => {
        const v = Number(valores[s.id] ?? s.percentual);
        return (
          <div key={s.id} className="flex items-center gap-3">
            <span className="flex-1 text-sm text-ink-900 truncate">{s.nome}</span>
            {ehAdmin ? (
              <>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={v}
                  onChange={(e) => setValores((old) => ({ ...old, [s.id]: e.target.value }))}
                  className="w-32"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={valores[s.id] ?? s.percentual}
                  onChange={(e) => setValores((old) => ({ ...old, [s.id]: e.target.value }))}
                  className="w-16 border border-border rounded px-2 py-1 text-sm text-right"
                />
                <span className="text-sm text-ink-500 w-4">%</span>
                <FormAcao action={excluirServicoAndamento} mostrarOk={false} className="contents">
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="text-ink-400 hover:text-danger p-1" aria-label="Remover" title={`Remover "${s.nome}"`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </FormAcao>
              </>
            ) : (
              <>
                <div className="w-32 h-2 bg-gray-100 rounded overflow-hidden">
                  <div className="h-full bg-primaryDark rounded" style={{ width: `${v}%` }} />
                </div>
                <span className="text-sm text-ink-700 w-10 text-right">{v}%</span>
              </>
            )}
          </div>
        );
      })}

      {ehAdmin && (
        <div className="flex items-center gap-3 pt-2 border-t">
          <button
            type="button"
            disabled={pendente}
            onClick={salvar}
            className="bg-primaryDark text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {pendente ? "Salvando…" : "Salvar andamento"}
          </button>
          {msg?.erro && <span className="text-sm text-danger">{msg.erro}</span>}
          {msg?.ok && <span className="text-sm text-success">{msg.ok}</span>}
        </div>
      )}
    </div>
  );
}
