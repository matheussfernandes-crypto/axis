import type { Metadata } from "next";
import LogoAxis from "@/components/LogoAxis";

export const metadata: Metadata = { title: "Política de privacidade" };

// Página pública. Texto base — revisar com assessoria jurídica antes da venda.
export default function Privacidade() {
  return (
    <main className="min-h-screen bg-surface-subtle text-ink-700 px-4 py-10">
      <article className="max-w-2xl mx-auto bg-white rounded-2xl p-6 sm:p-10 shadow-sm space-y-5 leading-relaxed text-[15px]">
        <div className="text-primaryDark"><LogoAxis className="h-9 w-auto" cinza="#A8A8A8" /></div>
        <h1 className="font-display text-2xl text-primaryDark">Política de privacidade</h1>

        <section className="space-y-2">
          <h2 className="font-semibold text-lg">Quem usa o Axis</h2>
          <p>O Axis é um sistema de gestão de obras usado por construtoras. Cada construtora tem seu próprio espaço, e só as pessoas aprovadas pelo administrador dela têm acesso.</p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold text-lg">Dados tratados</h2>
          <p>Nome, e-mail e setor de quem usa o sistema, e os dados de obra lançados pela construtora (obras, empreiteiros, medições, vales, contratos, fotos e documentos). Esses dados pertencem à construtora e são usados apenas para o funcionamento do sistema (LGPD, Lei 13.709/2018).</p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold text-lg">Separação e segurança</h2>
          <p>Os dados de cada construtora ficam isolados no banco de dados: uma construtora não consegue ver os dados de outra. O acesso é feito com login e senha, por conexão criptografada.</p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold text-lg">Seus direitos</h2>
          <p>Você pode pedir acesso, correção ou exclusão dos seus dados ao administrador da sua construtora ou pelo contato abaixo.</p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold text-lg">Contato</h2>
          <p>[e-mail de contato do Axis]</p>
        </section>
      </article>
    </main>
  );
}
