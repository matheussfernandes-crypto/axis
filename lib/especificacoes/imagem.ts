// Fotos do módulo Especificações. Ficam no bucket privado "especificacoes", sempre na pasta da construtora:
//   "<construtora_id>/esp/AAAA-MM-DD/arquivo.jpg"  -> precisa de URL assinada para aparecer
//   "data:image/..."                               -> foto embutida (só durante a importação de arquivo)
export const BUCKET_ESP = "especificacoes";

export const ehDoBucket = (img: string | null | undefined) => !!img && /^[0-9a-f-]{36}\/esp\//i.test(img);

export function urlImg(img: string | null | undefined, assinadas: Record<string, string> = {}) {
  if (!img) return "";
  if (img.startsWith("data:")) return img;
  if (ehDoBucket(img)) return assinadas[img] ?? "";
  return "";
}

/** Gera as URLs assinadas (1 h) das fotos que estão no bucket. */
export async function assinarImagens(supabase: any, imgs: (string | null | undefined)[]) {
  const caminhos = Array.from(new Set(imgs.filter(ehDoBucket))) as string[];
  const out: Record<string, string> = {};
  if (!caminhos.length) return out;
  const { data } = await supabase.storage.from(BUCKET_ESP).createSignedUrls(caminhos, 3600);
  for (const d of data ?? []) if (d.path && d.signedUrl) out[d.path] = d.signedUrl;
  return out;
}

/** Reduz a foto (lado maior 900 px, JPEG) antes de enviar. Roda no navegador. */
export async function reduzirFoto(arquivo: Blob, lado = 900): Promise<Blob> {
  const bmp = await createImageBitmap(arquivo);
  const k = Math.min(1, lado / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  return await new Promise((ok) => c.toBlob((b) => ok(b ?? arquivo), "image/jpeg", 0.85));
}

/** Envia a foto para a pasta da construtora no bucket e devolve o caminho (vai no campo img). Roda no navegador. */
export async function enviarFoto(supabase: any, arquivo: Blob): Promise<string> {
  const blob = await reduzirFoto(arquivo);
  const { data: pasta } = await supabase.rpc("minha_construtora");
  if (!pasta) throw new Error("Não foi possível identificar a construtora. Entre de novo.");
  const caminho = `${pasta}/esp/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from(BUCKET_ESP).upload(caminho, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error("Não foi possível enviar a foto: " + error.message);
  return caminho;
}

/** Envia o logo (PNG, mantém o fundo transparente) que sai no cabeçalho do PDF. Roda no navegador. */
export async function enviarLogo(supabase: any, arquivo: File): Promise<string> {
  if (arquivo.type !== "image/png") throw new Error("O logo precisa ser um arquivo PNG.");
  if (arquivo.size > 2 * 1024 * 1024) throw new Error("O logo passa de 2 MB. Use uma imagem menor.");
  const { data: pasta } = await supabase.rpc("minha_construtora");
  if (!pasta) throw new Error("Não foi possível identificar a construtora. Entre de novo.");
  const caminho = `${pasta}/esp/logos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
  const { error } = await supabase.storage.from(BUCKET_ESP).upload(caminho, arquivo, { contentType: "image/png", upsert: false });
  if (error) throw new Error("Não foi possível enviar o logo: " + error.message);
  return caminho;
}

/** Logo padrão dos PDFs da Arquitetura (vale para os projetos sem logo próprio): um arquivo fixo na pasta da construtora. */
export const caminhoLogoPadrao = (construtoraId: string) => `${construtoraId}/esp/logo-padrao.png`;

/** Troca o logo padrão (PNG). Roda no navegador. */
export async function enviarLogoPadrao(supabase: any, arquivo: File): Promise<string> {
  if (arquivo.type !== "image/png") throw new Error("O logo precisa ser um arquivo PNG.");
  if (arquivo.size > 2 * 1024 * 1024) throw new Error("O logo passa de 2 MB. Use uma imagem menor.");
  const { data: pasta } = await supabase.rpc("minha_construtora");
  if (!pasta) throw new Error("Não foi possível identificar a construtora. Entre de novo.");
  const caminho = caminhoLogoPadrao(pasta);
  await supabase.storage.from(BUCKET_ESP).remove([caminho]);
  const { error } = await supabase.storage.from(BUCKET_ESP).upload(caminho, arquivo, { contentType: "image/png", upsert: false });
  if (error) throw new Error("Não foi possível enviar o logo: " + error.message);
  return caminho;
}

/** Tira o logo padrão. Roda no navegador. */
export async function tirarLogoPadrao(supabase: any) {
  const { data: pasta } = await supabase.rpc("minha_construtora");
  if (pasta) await supabase.storage.from(BUCKET_ESP).remove([caminhoLogoPadrao(pasta)]);
}
