import Link from "next/link";
import { Mail } from "lucide-react";
import { login } from "./actions";
import PasswordField from "../components/PasswordField";
import PwaInstallGuide from "../components/PwaInstallGuide";
import LogoAxis from "@/components/LogoAxis";

export default function LoginPage({ searchParams }: { searchParams: { erro?: string; sucesso?: string; aviso?: string } }) {
  return (
    <main className="min-h-screen lg:flex">
      {/* Painel da marca — só no computador */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B0B0B] relative overflow-hidden flex-col justify-between p-12 text-[#E6E6E6]">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(#161616 1px, transparent 1px), linear-gradient(90deg, #161616 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        <LogoAxis className="h-12 w-auto self-start relative" />
        <div className="relative">
          <h1 className="font-display text-4xl font-normal leading-tight max-w-md">Medições, vales e contratos da sua obra em um só lugar.</h1>
          <p className="text-[#9A9A9A] mt-4 max-w-sm">Lançamentos direto do canteiro, aprovação do engenheiro e fechamento do mês com PDF.</p>
        </div>
        <p className="text-[#6E6E6E] text-xs tracking-[0.3em] relative">AXIS · GESTÃO DE OBRAS</p>
      </div>

      {/* Login */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12 bg-surface-subtle">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex justify-center mb-8 text-primaryDark">
            <LogoAxis className="h-9 w-auto" cinza="#A8A8A8" />
          </div>

          <h1 className="font-display text-2xl text-ink-900 mb-1">Entrar</h1>
          <p className="text-sm text-ink-500 mb-6">Acesse com o e-mail e a senha do seu cadastro.</p>

          <form action={login} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink-700 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
                <input id="email" name="email" type="email" required autoComplete="email" placeholder="seuemail@empresa.com.br"
                  className="w-full border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-ink-700">Senha</label>
                <Link href="/esqueci-senha" className="text-xs text-primary font-semibold hover:underline">Esqueceu sua senha?</Link>
              </div>
              <PasswordField name="senha" required placeholder="••••••••" />
            </div>

            {searchParams.erro && <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{searchParams.erro}</p>}
            {(searchParams.sucesso || searchParams.aviso) && (
              <p className="text-sm text-ink-700 bg-ink-100 border border-ink-200 rounded-lg px-3 py-2">{searchParams.sucesso || searchParams.aviso}</p>
            )}

            <button type="submit" className="w-full bg-primaryDark text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90 transition">Entrar</button>
          </form>

          <p className="text-sm text-center text-ink-500 mt-6">
            Ainda não usa o Axis? <Link href="/cadastro" className="text-primaryDark font-semibold hover:underline">Criar conta</Link>
          </p>
          <PwaInstallGuide />
        </div>
      </div>
    </main>
  );
}
