"use client";

import { useState } from "react";
import { X } from "lucide-react";

/** Botão que abre um PDF numa janela própria do Axis (com X pra fechar), em vez de navegar
 *  pra URL do PDF — no app instalado (modo standalone), navegar direto trocava pra tela do
 *  visualizador nativo sem nenhum botão de voltar visível. */
export default function VisualizadorPdf({
  href,
  titulo = "PDF",
  className,
  children,
}: {
  href: string;
  titulo?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAberto(true)} className={className}>
        {children}
      </button>
      {aberto && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col" style={{ overscrollBehavior: "none" }}>
          <div
            className="flex items-center justify-between bg-primaryDark text-white px-4 shrink-0"
            style={{ paddingTop: "calc(12px + env(safe-area-inset-top))", paddingBottom: 12 }}
          >
            <span className="text-sm font-semibold truncate">{titulo}</span>
            <button type="button" onClick={() => setAberto(false)} className="p-1.5 -m-1.5" aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
          </div>
          <iframe src={href} className="flex-1 w-full bg-white" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} title={titulo} />
        </div>
      )}
    </>
  );
}
