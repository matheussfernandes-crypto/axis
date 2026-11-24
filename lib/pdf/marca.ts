import { AsyncLocalStorage } from "node:async_hooks";

// Marca da construtora usada nos PDFs (nome + logotipo PNG quadrado).
// Cada geração de PDF roda dentro de comMarca(...), então duas construtoras gerando
// PDFs ao mesmo tempo nunca trocam de logo entre si.
export type Marca = { nome: string; cnpj: string | null; logo?: string };

const store = new AsyncLocalStorage<Marca>();

export function marcaAtual(): Marca {
  return store.getStore() ?? { nome: "", cnpj: null };
}

/** Carrega nome e logo da construtora de quem está logado e executa a geração do PDF com eles. */
export async function comMarca<T>(supabase: any, gerar: () => Promise<T>): Promise<T> {
  const marca = await carregarMarca(supabase);
  return store.run(marca, gerar);
}

export async function carregarMarca(supabase: any): Promise<Marca> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { nome: "", cnpj: null };
  const { data: cid } = await supabase.rpc("minha_construtora");
  if (!cid) return { nome: "", cnpj: null };
  const { data: c } = await supabase.from("construtoras").select("nome, cnpj, logo_path").eq("id", cid).single();
  let logo: string | undefined;
  if (c?.logo_path) {
    const { data: blob } = await supabase.storage.from("logos").download(c.logo_path);
    if (blob) logo = `data:image/png;base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`;
  }
  return { nome: c?.nome ?? "", cnpj: c?.cnpj ?? null, logo };
}
