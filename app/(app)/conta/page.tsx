import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, perfilDaRequisicao } from "@/lib/auth/getCurrentUserProfile";

export const metadata = { title: "Licença e mensalidades" };

const brl = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (d?: string | null) => (d ? d.slice(0, 10).split("-").reverse().join("/") : "—");
const mesBR = (m: string) => {
  const [a, mm] = m.split("-");
  return new Date(Number(a), Number(mm) - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};
const SITUACAO: Record<string, string> = { TESTE: "Período de teste", ATIVO: "Ativa", SUSPENSO: "Suspensa", CANCELADO: "Cancelada" };
const FATURA: Record<string, string> = { ABERTA: "Em aberto", PAGA: "Paga", ATRASADA: "Atrasada", CANCELADA: "Cancelada" };

export default async function ContaPage() {
  const supabase = createClient();
  const user = await getUsuarioAtual();
  const { data: perfil } = await perfilDaRequisicao(user!.id);
  if (perfil?.setor !== "ADMIN") redirect("/dashboard");

  const { data: eu } = await supabase.from("perfis").select("construtora_id").eq("id", user!.id).single();
  const [{ data: c }, { data: planos }, { data: faturas }, { count: usuarios }, { count: obrasAtivas }] = await Promise.all([
    supabase.from("construtoras").select("nome, plano, plano_id, teste_ate, ciclo, assinatura_desde, proxima_cobranca").eq("id", eu!.construtora_id).single(),
    supabase.from("planos").select("id, nome, descricao, preco_mensal, limite_obras, limite_usuarios, modulos").order("ordem"),
    supabase.from("faturas").select("id, competencia, valor, vencimento, status, pago_em, forma_pagamento, link_pagamento, nota_fiscal_url").order("vencimento", { ascending: false }).limit(24),
    supabase.from("perfis").select("id", { count: "exact", head: true }).eq("status", "aprovado"),
    supabase.from("obras").select("id", { count: "exact", head: true }).eq("status", "EM_ANDAMENTO"),
  ]);
  const atual = (planos ?? []).find((p) => p.id === c?.plano_id) ?? null;
  const diasTeste = c?.plano === "TESTE" && c?.teste_ate ? Math.ceil((new Date(c.teste_ate + "T23:59:59").getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="font-display text-2xl text-ink-900">Licença e mensalidades</h1>

      <section className="card grid sm:grid-cols-3 gap-5">
        <div className="sm:col-span-2 space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-400">Plano atual</p>
          <p className="font-display text-2xl text-ink-900">{atual?.nome ?? (c?.plano === "TESTE" ? "Teste gratuito" : "—")}</p>
          <p className="text-sm text-ink-500">
            Licença: <b className="text-ink-700">{SITUACAO[c?.plano ?? "TESTE"]}</b>
            {diasTeste !== null && (diasTeste > 0 ? ` · termina em ${diasTeste} dia${diasTeste === 1 ? "" : "s"} (${dataBR(c?.teste_ate)})` : " · encerrado")}
            {c?.proxima_cobranca ? ` · próxima cobrança em ${dataBR(c.proxima_cobranca)}` : ""}
          </p>
        </div>
        <dl className="text-sm space-y-1">
          <div className="flex justify-between"><dt className="text-ink-500">Usuários ativos</dt><dd className="font-semibold">{usuarios ?? 0}{atual?.limite_usuarios ? ` / ${atual.limite_usuarios}` : ""}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-500">Obras em andamento</dt><dd className="font-semibold">{obrasAtivas ?? 0}{atual?.limite_obras ? ` / ${atual.limite_obras}` : ""}</dd></div>
          {atual && <div className="flex justify-between"><dt className="text-ink-500">Mensalidade</dt><dd className="font-semibold">{brl(atual.preco_mensal)}</dd></div>}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-ink-900">Planos</h2>
        {(planos ?? []).length === 0 ? (
          <div className="card text-sm text-ink-500">Os planos e valores serão publicados em breve. Fale com o suporte do Axis para contratar.</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {(planos ?? []).map((p) => {
              const eAtual = p.id === c?.plano_id;
              return (
                <article key={p.id} className={"card space-y-3 " + (eAtual ? "!border-primaryDark" : "")}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg">{p.nome}</h3>
                    {eAtual && <span className="badge bg-primaryDark text-white">Seu plano</span>}
                  </div>
                  <p className="font-display text-2xl">{brl(p.preco_mensal)}<span className="text-sm text-ink-500 font-sans">/mês</span></p>
                  {p.descricao && <p className="text-sm text-ink-500">{p.descricao}</p>}
                  <ul className="text-sm space-y-1 text-ink-700">
                    <li>{p.limite_obras ? `Até ${p.limite_obras} obras em andamento` : "Obras ilimitadas"}</li>
                    <li>{p.limite_usuarios ? `Até ${p.limite_usuarios} usuários` : "Usuários ilimitados"}</li>
                  </ul>
                  {!eAtual && <a href="mailto:[email-do-suporte]?subject=Trocar%20de%20plano" className="inline-flex items-center justify-center w-full border border-border rounded-lg min-h-[44px] text-sm font-medium hover:border-ink-400">Quero este plano</a>}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-ink-900">Mensalidades</h2>
        <div className="card-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left"><th className="px-4 py-3">Mês</th><th className="px-4 py-3">Vencimento</th><th className="px-4 py-3 text-right">Valor</th><th className="px-4 py-3">Situação</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {(faturas ?? []).length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-ink-500">Nenhuma mensalidade ainda.</td></tr>}
              {(faturas ?? []).map((f) => (
                <tr key={f.id} className="border-t border-border">
                  <td className="px-4 py-3 capitalize">{mesBR(f.competencia)}</td>
                  <td className="px-4 py-3">{dataBR(f.vencimento)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{brl(f.valor)}</td>
                  <td className="px-4 py-3"><span className={"badge " + (f.status === "PAGA" ? "badge-aprovado" : f.status === "ATRASADA" ? "badge-rejeitado" : "badge-pendente")}>{FATURA[f.status]}</span>{f.pago_em ? <span className="text-xs text-ink-500 ml-2">em {dataBR(f.pago_em)}</span> : null}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {f.link_pagamento && f.status !== "PAGA" && <a href={f.link_pagamento} target="_blank" rel="noopener noreferrer" className="text-primaryDark font-semibold underline mr-3">Pagar</a>}
                    {f.nota_fiscal_url && <a href={f.nota_fiscal_url} target="_blank" rel="noopener noreferrer" className="text-ink-600 underline">Nota fiscal</a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
