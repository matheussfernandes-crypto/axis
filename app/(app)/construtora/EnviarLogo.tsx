"use client";

import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registrarLogo } from "./actions";

// Aceita só PNG quadrado (mesma largura e altura), entre 200 e 2000 px, até 2 MB.
function medir(file: File): Promise<{ w: number; h: number }> {
  return new Promise((ok, erro) => {
    const img = new Image();
    img.onload = () => { ok({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(img.src); };
    img.onerror = () => erro(new Error("Imagem inválida."));
    img.src = URL.createObjectURL(file);
  });
}

export default function EnviarLogo({ construtoraId }: { construtoraId: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(file?: File) {
    if (!file) return;
    setMsg(null);
    if (file.type !== "image/png") return setMsg({ tipo: "erro", texto: "O logotipo precisa ser um arquivo PNG." });
    if (file.size > 2 * 1024 * 1024) return setMsg({ tipo: "erro", texto: "O arquivo passa de 2 MB." });
    const { w, h } = await medir(file).catch(() => ({ w: 0, h: 0 }));
    if (!w || w !== h) return setMsg({ tipo: "erro", texto: `O logotipo precisa ser quadrado (largura igual à altura). Este tem ${w}×${h} px.` });
    if (w < 200 || w > 2000) return setMsg({ tipo: "erro", texto: "Use um PNG entre 200×200 e 2000×2000 px." });

    setEnviando(true);
    const supabase = createClient();
    const caminho = `${construtoraId}/logo.png`;
    const { error } = await supabase.storage.from("logos").upload(caminho, file, { contentType: "image/png", upsert: true, cacheControl: "60" });
    if (error) {
      setEnviando(false);
      return setMsg({ tipo: "erro", texto: "Não foi possível enviar: " + error.message });
    }
    await registrarLogo(caminho);
    setEnviando(false);
    setMsg({ tipo: "ok", texto: "Logotipo atualizado. Ele já sai nos próximos PDFs." });
    if (ref.current) ref.current.value = "";
  }

  return (
    <div className="space-y-2">
      <input ref={ref} type="file" accept="image/png" className="hidden" onChange={(e) => enviar(e.target.files?.[0])} />
      <button type="button" onClick={() => ref.current?.click()} disabled={enviando}
        className="inline-flex items-center gap-2 bg-primaryDark text-white rounded-lg px-4 min-h-[44px] text-sm font-semibold hover:opacity-90 disabled:opacity-50">
        <ImageUp className="w-4 h-4" aria-hidden />
        {enviando ? "Enviando…" : "Enviar logotipo (PNG quadrado)"}
      </button>
      {msg && <p className={"text-sm " + (msg.tipo === "ok" ? "text-success" : "text-danger")}>{msg.texto}</p>}
    </div>
  );
}
