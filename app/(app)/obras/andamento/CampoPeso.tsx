"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function CampoPeso({
  categoriaId,
  servicoId,
  valor,
  travado,
  definirPeso,
}: {
  categoriaId: string;
  servicoId: string;
  valor: number;
  travado: boolean;
  definirPeso: (fd: FormData) => Promise<{ erro?: string; ok?: string }>;
}) {
  const router = useRouter();
  const [v, setV] = useState(String(valor));
  const [pendente, start] = useTransition();

  function salvar() {
    const num = Number(v.replace(",", "."));
    if (Number.isNaN(num) || num === valor) return;
    const fd = new FormData();
    fd.set("categoriaId", categoriaId);
    fd.set("servicoId", servicoId);
    fd.set("valor", String(num));
    start(async () => {
      await definirPeso(fd);
      router.refresh();
    });
  }

  return (
    <input
      inputMode="decimal"
      value={pendente ? "…" : v}
      onChange={(e) => setV(e.target.value)}
      onBlur={salvar}
      disabled={pendente}
      className={`w-16 border rounded px-2 py-1 text-sm text-right ${travado ? "border-primary font-semibold" : "border-border"}`}
      title={travado ? "Peso travado (ajustado manualmente)" : "Peso automático"}
    />
  );
}
