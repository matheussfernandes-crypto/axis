// Preços pesquisados (até 3 por modelo/item) e a média deles: só uma base de valores, não é orçamento.
export type Preco = { loja: string; valor: number; link?: string; data?: string };

export const MAX_PRECOS = 3;

/** Limpa o que veio da tela ou do banco: até 3 preços com valor > 0; link só http(s). */
export function limparPrecos(v: unknown): Preco[] {
  if (!Array.isArray(v)) return [];
  const hoje = new Date().toISOString().slice(0, 10);
  return v
    .map((p: any) => {
      const valor = Math.round(Number(String(p?.valor ?? "").replace(",", ".")) * 100) / 100;
      const link = String(p?.link ?? "").trim();
      const data = String(p?.data ?? "").trim();
      return {
        loja: String(p?.loja ?? "").trim().slice(0, 60),
        valor,
        link: /^https?:\/\//i.test(link) ? link.slice(0, 500) : "",
        data: /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : hoje,
      };
    })
    .filter((p) => Number.isFinite(p.valor) && p.valor > 0)
    .slice(0, MAX_PRECOS);
}

/** Média dos preços (null quando não há nenhum). */
export function mediaPrecos(v: unknown): number | null {
  const p = limparPrecos(v);
  if (!p.length) return null;
  return Math.round((p.reduce((s, x) => s + x.valor, 0) / p.length) * 100) / 100;
}

/** Data mais recente entre os preços (AAAA-MM-DD). */
export function dataPrecos(v: unknown): string | null {
  const d = limparPrecos(v).map((p) => p.data!).sort();
  return d.length ? d[d.length - 1] : null;
}

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
