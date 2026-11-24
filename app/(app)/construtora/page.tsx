import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, perfilDaRequisicao } from "@/lib/auth/getCurrentUserProfile";
import { salvarDados, removerLogo, novoCodigoConvite } from "./actions";
import EnviarLogo from "./EnviarLogo";

export const metadata = { title: "Dados da construtora" };
const campo = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-white";

export default async function ConstrutoraPage() {
  const supabase = createClient();
  const user = await getUsuarioAtual();
  const { data: perfil } = await perfilDaRequisicao(user!.id);
  if (perfil?.setor !== "ADMIN") redirect("/dashboard");

  const { data: cid } = await supabase.rpc("minha_construtora");
  const { data: c } = await supabase.from("construtoras").select("id, nome, cnpj, codigo_convite, logo_path, logo_atualizado_em").eq("id", cid).single();
  const logoUrl = c?.logo_path ? (await supabase.storage.from("logos").createSignedUrl(c.logo_path, 600)).data?.signedUrl : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-2xl text-ink-900">Dados da construtora</h1>

      <form action={salvarDados} className="card space-y-4">
        <h2 className="font-semibold text-ink-900">Identificação</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">Nome<input name="nome" required defaultValue={c?.nome ?? ""} className={campo + " mt-1"} /></label>
          <label className="text-sm">CNPJ<input name="cnpj" inputMode="numeric" defaultValue={c?.cnpj ?? ""} className={campo + " mt-1"} /></label>
        </div>
        <button type="submit" className="bg-primaryDark text-white rounded-lg px-5 min-h-[44px] text-sm font-semibold hover:opacity-90">Salvar</button>
      </form>

      <section className="card space-y-4">
        <div>
          <h2 className="font-semibold text-ink-900">Logotipo</h2>
          <p className="text-sm text-ink-500 mt-1">Aparece nos PDFs de fechamento, boletins de medição, contratos e relatórios. Use um PNG quadrado (de preferência 1000×1000 px, fundo transparente ou branco), até 2 MB.</p>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="w-32 h-32 rounded-xl border border-dashed border-ink-300 bg-surface-subtle flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={`Logotipo de ${c?.nome}`} className="w-full h-full object-contain" />
            ) : (
              <span className="text-xs text-ink-400 text-center px-2">Sem logotipo</span>
            )}
          </div>
          <div className="space-y-3">
            <EnviarLogo construtoraId={c!.id} />
            {logoUrl && (
              <form action={removerLogo}>
                <button type="submit" className="text-sm text-danger underline">Remover logotipo</button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold text-ink-900">Convidar a equipe</h2>
        <p className="text-sm text-ink-500">Envie este código para quem vai usar o sistema. A pessoa cria a conta em “Entrar numa equipe” e você aprova em Aprovação de logins.</p>
        <div className="flex flex-wrap items-center gap-3">
          <code className="font-display text-2xl tracking-[0.35em] bg-ink-100 rounded-lg px-4 py-2 text-ink-900">{c?.codigo_convite}</code>
          <form action={novoCodigoConvite}>
            <button type="submit" className="text-sm border border-border rounded-lg px-4 min-h-[44px] hover:border-ink-400">Gerar novo código</button>
          </form>
        </div>
      </section>
    </div>
  );
}
