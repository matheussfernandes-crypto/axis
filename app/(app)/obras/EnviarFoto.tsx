"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registrarFotoObra } from "./actions";

// Envia a foto direto do navegador para o Storage, na pasta da construtora, e registra na obra.
export default function EnviarFoto({ obraId }: { obraId: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<"" | "enviando" | "ok" | "erro">("");

  async function enviar(files: FileList | null) {
    if (!files?.length) return;
    setEstado("enviando");
    const supabase = createClient();
    const { data: pasta } = await supabase.rpc("minha_construtora");
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const caminho = `${pasta}/${obraId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${(file.name.split(".").pop() || "jpg").toLowerCase()}`;
        const { error } = await supabase.storage.from("obra-fotos").upload(caminho, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        await registrarFotoObra(obraId, caminho, null);
      }
      setEstado("ok");
    } catch {
      setEstado("erro");
    }
    if (ref.current) ref.current.value = "";
  }

  return (
    <>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => enviar(e.target.files)} />
      <button type="button" onClick={() => ref.current?.click()} disabled={estado === "enviando"}
        className="inline-flex items-center gap-1.5 text-xs font-medium border border-border rounded-lg px-3 min-h-[36px] hover:border-ink-400 disabled:opacity-50">
        <Camera className="w-3.5 h-3.5" aria-hidden />
        {estado === "enviando" ? "Enviando…" : estado === "ok" ? "Foto enviada" : estado === "erro" ? "Falhou, tente de novo" : "Adicionar fotos"}
      </button>
    </>
  );
}
