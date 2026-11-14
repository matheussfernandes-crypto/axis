"use client";

import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import type { FotoPainel, ResumoObra } from "./painel-obras";

// Slide de uma obra na página inicial: fotos recentes à esquerda e, à direita, o resumo do mês.
const dataBR = (iso: string) => iso.split("-").reverse().join("/");
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function SlideObra({ p, fotos, ativo }: { p: ResumoObra; fotos: FotoPainel[]; ativo?: boolean }) {
  const [foto, setFoto] = useState(0);

  useEffect(() => {
    if (fotos.length < 2) return;
    const t = setInterval(() => setFoto((i) => (i + 1) % fotos.length), 3500);
    return () => clearInterval(t);
  }, [fotos.length]);
  useEffect(() => {
    if (ativo) setFoto(0);
  }, [ativo]);

  const atual = fotos[foto];
  const itens = [
    { rotulo: "Medido no mês", valor: brl(p.medidoMes) },
    { rotulo: "Vales no mês", valor: brl(p.valesMes) },
    { rotulo: "Aguardando aprovação", valor: String(p.pendentes) },
    { rotulo: "Contratos ativos", valor: String(p.contratosAtivos) },
    { rotulo: "Empreiteiros ativos", valor: String(p.pessoasAtivas) },
  ];

  return (
    <div className="h-full w-full bg-white grid grid-rows-[200px_minmax(0,1fr)] lg:grid-rows-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="relative bg-primaryDark overflow-hidden">
        {fotos.length ? (
          fotos.map((f, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={f.url}
              src={f.url}
              alt={f.legenda ?? f.obraNome}
              loading={i === 0 ? "eager" : "lazy"}
              className="absolute inset-0 w-full h-full object-cover transition-[opacity,transform] duration-[1200ms] ease-out"
              style={{ opacity: i === foto ? 1 : 0, transform: i === foto ? "scale(1.04)" : "scale(1)" }}
            />
          ))
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60 text-sm">
            <Camera className="w-8 h-8" />
            Sem fotos desta obra ainda
          </div>
        )}
        {atual && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pt-10 pb-8">
            <p className="text-white/90 text-xs">
              Foto de {dataBR(atual.dataFoto)}
              {atual.legenda ? ` · ${atual.legenda}` : ""}
            </p>
          </div>
        )}
      </div>

      <div className="p-5 pr-12 lg:p-6 lg:pr-12 flex flex-col min-h-0 overflow-y-auto">
        <div className="pr-10">
          <h2 className="text-primaryDark font-semibold text-lg leading-tight">{p.nome}</h2>
          <p className="text-xs text-ink-500">
            Em andamento{p.cidade ? ` · ${p.cidade}` : ""}
            {p.dataEntregaPrevista ? ` · entrega prevista ${dataBR(p.dataEntregaPrevista)}` : ""}
          </p>
        </div>
        <dl className="mt-5 divide-y divide-ink-100">
          {itens.map((i) => (
            <div key={i.rotulo} className="flex items-center justify-between py-2.5 text-sm">
              <dt className="text-ink-500">{i.rotulo}</dt>
              <dd className="font-semibold text-primaryDark tabular-nums">{i.valor}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
