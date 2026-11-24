import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { BUCKET_ESP, caminhoLogoPadrao, ehDoBucket } from "@/lib/especificacoes/imagem";
import { esquemaVidro } from "@/lib/especificacoes/desenho";
import { GRUPOS, descVidro, ehGrupo, fold, medidasVidro, type Grupo, type Vidro } from "@/lib/especificacoes/regras";
import { EspecificacaoPdf, type AmbientePdf } from "@/lib/pdf/EspecificacaoPdf";
import { podeArquitetura } from "../../../acesso";

export const dynamic = "force-dynamic";

// PDF da folha de especificação de um grupo (?grupo=metais|eletros|vidros), em A3 ou A4 paisagem.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  const { data: perfil } = await supabase.from("perfis").select("setor, status, acessos").eq("id", user.id).single();
  if (!podeArquitetura(perfil)) return NextResponse.json({ erro: "Acesso restrito." }, { status: 403 });

  const g0 = new URL(request.url).searchParams.get("grupo");
  const grupo: Grupo = ehGrupo(g0) ? g0 : "metais";
  const [{ data: projeto }, { data: itens }, { data: nota }] = await Promise.all([
    supabase.from("esp_projetos").select("id, codigo, titulo, cliente, unidade, logo").eq("id", params.id).maybeSingle(),
    supabase.from("esp_itens").select("id, ambiente, material, referencia, medidas, qtd, img, ordem, vidro").eq("projeto_id", params.id).eq("grupo", grupo).order("ordem"),
    supabase.from("esp_notas").select("obs, rev, papel").eq("projeto_id", params.id).eq("grupo", grupo).maybeSingle(),
  ]);
  if (!projeto) return NextResponse.json({ erro: "Projeto não encontrado." }, { status: 404 });

  // logo: o do projeto ou, se não tiver, o logo padrão da Arquitetura
  const { data: pasta } = await supabase.rpc("minha_construtora");
  const logoPath = projeto.logo || (pasta ? caminhoLogoPadrao(pasta) : null);
  // fotos e logo baixados do bucket e embutidos no PDF
  const caminhos = Array.from(new Set([...(itens ?? []).map((i) => i.img), logoPath].filter(ehDoBucket))) as string[];
  const embutidas: Record<string, string> = {};
  await Promise.all(
    caminhos.map(async (c) => {
      const { data: blob } = await supabase.storage.from(BUCKET_ESP).download(c);
      if (blob) embutidas[c] = `data:${c.endsWith(".png") ? "image/png" : "image/jpeg"};base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`;
    })
  );

  const g = GRUPOS.find((x) => x.id === grupo)!;
  const vidros = grupo === "vidros";
  const ambientes = new Map<string, AmbientePdf>();
  for (const i of itens ?? []) {
    const k = fold(i.ambiente).trim() || "-";
    if (!ambientes.has(k)) ambientes.set(k, { nome: i.ambiente || "Sem ambiente", itens: [] });
    const v = (i.vidro ?? {}) as Vidro;
    const foto = embutidas[i.img];
    ambientes.get(k)!.itens.push({
      id: i.id,
      material: (i.material || "").toUpperCase(),
      texto: vidros ? descVidro(i.material, v) : i.referencia,
      medidas: vidros ? medidasVidro(v) : i.medidas,
      qtd: i.qtd || 1,
      foto,
      desenho: !foto && vidros ? esquemaVidro(i.material, v) : undefined,
    });
  }

  const rev = (nota?.rev || "R0").toUpperCase();
  const arquivo = ["ESPECIFICAÇÃO", g.label, projeto.titulo, rev].filter(Boolean).join(" - ").toUpperCase().replace(/[\\/:*?"<>|]/g, "");
  const buffer = await renderToBuffer(
    EspecificacaoPdf({
      papel: nota?.papel === "a4p" ? "A4" : "A3",
      titulo: `Tabela de ${g.label}`,
      cliente: projeto.cliente ?? undefined,
      obra: [projeto.codigo, projeto.titulo, projeto.unidade && `Unidade ${projeto.unidade}`].filter(Boolean).join(" · "),
      subtitulo: [projeto.codigo, projeto.titulo, projeto.unidade && `Unidade ${projeto.unidade}`, projeto.cliente].filter(Boolean).join(" · "),
      rev,
      emitido: new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      obs: nota?.obs ?? "",
      logo: logoPath ? embutidas[logoPath] : undefined,
      medidas: g.medidas,
      vidros,
      arquivo,
      ambientes: Array.from(ambientes.values()),
    })
  );
  const ascii = arquivo.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7e]/g, "");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${ascii}.pdf"; filename*=UTF-8''${encodeURIComponent(arquivo + ".pdf")}`,
      "Cache-Control": "no-store",
    },
  });
}
