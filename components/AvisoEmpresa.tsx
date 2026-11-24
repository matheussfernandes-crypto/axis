"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { entrarNaEmpresa } from "@/app/(app)/plataforma/actions";

/** Faixa no topo quando o dono do Axis está dentro de outra empresa. */
export default function AvisoEmpresa({ nome, propria }: { nome: string; propria: string }) {
  const router = useRouter();
  const [pend, start] = useTransition();
  return (
    <div className="print:hidden flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-2 text-sm">
      <span className="flex items-center gap-2 text-ink-900">
        <Building2 className="h-4 w-4 text-warning" /> Você está dentro da empresa <b>{nome}</b>. Tudo o que você vê e grava aqui é dela.
      </span>
      <button
        type="button"
        disabled={pend}
        className="rounded-lg bg-primaryDark px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
        onClick={() =>
          start(async () => {
            await entrarNaEmpresa(null);
            router.push("/plataforma");
            router.refresh();
          })
        }
      >
        {pend ? "Voltando…" : `Voltar para ${propria}`}
      </button>
    </div>
  );
}
