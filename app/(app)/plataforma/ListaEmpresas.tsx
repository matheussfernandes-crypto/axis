"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, LogIn, Pause, Play, Star, X } from "lucide-react";
import { definirPlano, entrarNaEmpresa } from "./actions";

export type Empresa = {
  id: string; nome: string; cnpj: string | null; plano: string; teste_ate: string | null; criado_em: string;
  usuarios: number; pendentes: number; admin_nome: string | null; admin_email: string | null;
};

const ROTULO: Record<string, { txt: string; cls: string }> = {
  PENDENTE: { txt: "Aguardando aceite", cls: "bg-warning/15 text-warning" },
  TESTE: { txt: "Em teste", cls: "bg-primary/10 text-primary" },
  ATIVO: { txt: "Ativa", cls: "bg-success/15 text-success" },
  SUSPENSO: { txt: "Suspensa", cls: "bg-ink-200 text-ink-700" },
  CANCELADO: { txt: "Recusada / cancelada", cls: "bg-[#FDECEA] text-[#B3261E]" },
};
const data = (d: string | null) => (d ? new Date(d.length === 10 ? d + "T12:00" : d).toLocaleDateString("pt-BR") : "—");
const cnpjFmt = (c: string | null) => (c && c.length === 14 ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : c || "");
const btn = "inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:border-primary hover:text-primary disabled:opacity-50";

export default function ListaEmpresas({ empresas, atual, propria }: { empresas: Empresa[]; atual: string; propria: string }) {
  const router = useRouter();
  const [pend, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const agir = (f: () => Promise<void>, depois?: string) =>
    start(async () => {
      setErro(null);
      try {
        await f();
        if (depois) router.push(depois);
        router.refresh();
      } catch (e: any) {
        setErro(e.message);
      }
    });
  const plano = (e: Empresa, p: string, pergunta?: string) => {
    if (pergunta && !window.confirm(pergunta)) return;
    agir(() => definirPlano(e.id, p));
  };

  return (
    <div className="space-y-3">
      {erro && <div className="rounded-[10px] border border-[#F1C4BF] bg-[#FDECEA] px-3 py-2 text-sm text-[#B3261E]">{erro}</div>}
      {empresas.map((e) => {
        const r = ROTULO[e.plano] ?? { txt: e.plano, cls: "bg-ink-100 text-ink-700" };
        const dentro = e.id === atual;
        return (
          <div key={e.id} className={`card flex flex-wrap items-center gap-3 ${e.plano === "PENDENTE" ? "border-warning/50" : ""}`}>
            <div className="min-w-[220px] flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink-900">{e.nome}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.cls}`}>{r.txt}</span>
                {e.id === propria && <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-semibold text-primaryDark">Sua empresa</span>}
                {dentro && e.id !== propria && <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">Você está dentro</span>}
              </div>
              <div className="mt-0.5 text-xs text-ink-500">
                {[cnpjFmt(e.cnpj) && `CNPJ ${cnpjFmt(e.cnpj)}`, e.admin_nome && `ADM: ${e.admin_nome}${e.admin_email ? ` (${e.admin_email})` : ""}`].filter(Boolean).join(" · ")}
              </div>
              <div className="text-xs text-ink-500">
                Cadastro em {data(e.criado_em)} · {e.usuarios} usuário(s) ativo(s){e.pendentes ? ` · ${e.pendentes} aguardando aprovação` : ""}
                {e.plano === "TESTE" && ` · teste até ${data(e.teste_ate)}`}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {e.plano === "PENDENTE" && (
                <>
                  <button type="button" className={btn} disabled={pend} onClick={() => plano(e, "TESTE")}>
                    <Check className="h-3.5 w-3.5" /> Aceitar (30 dias de teste)
                  </button>
                  <button type="button" className={btn} disabled={pend} onClick={() => plano(e, "CANCELADO", `Recusar a empresa ${e.nome}? Ninguém dela consegue entrar.`)}>
                    <X className="h-3.5 w-3.5" /> Recusar
                  </button>
                </>
              )}
              {(e.plano === "TESTE" || e.plano === "SUSPENSO" || e.plano === "CANCELADO") && (
                <button type="button" className={btn} disabled={pend} onClick={() => plano(e, "ATIVO")}>
                  <Star className="h-3.5 w-3.5" /> Ativar plano
                </button>
              )}
              {(e.plano === "SUSPENSO" || e.plano === "CANCELADO") && (
                <button type="button" className={btn} disabled={pend} onClick={() => plano(e, "TESTE")}>
                  <Play className="h-3.5 w-3.5" /> Reativar (30 dias de teste)
                </button>
              )}
              {(e.plano === "TESTE" || e.plano === "ATIVO") && e.id !== propria && (
                <button type="button" className={btn} disabled={pend} onClick={() => plano(e, "SUSPENSO", `Suspender a empresa ${e.nome}? Ninguém dela consegue entrar até você reativar.`)}>
                  <Pause className="h-3.5 w-3.5" /> Suspender
                </button>
              )}
              {!dentro && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primaryDark disabled:opacity-50"
                  disabled={pend}
                  onClick={() => agir(() => entrarNaEmpresa(e.id === propria ? null : e.id), "/dashboard")}
                >
                  <LogIn className="h-3.5 w-3.5" /> {e.id === propria ? "Voltar para a minha" : "Entrar"}
                </button>
              )}
            </div>
          </div>
        );
      })}
      {!empresas.length && <p className="text-sm text-ink-500">Nenhuma empresa cadastrada.</p>}
    </div>
  );
}
