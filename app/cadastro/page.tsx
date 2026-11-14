import Link from "next/link";
import { criarConstrutora, entrarNaEquipe } from "./actions";
import PasswordField from "../components/PasswordField";
import Selecao from "@/components/ui/Selecao";
import LogoAxis from "@/components/LogoAxis";

const campo = "w-full border border-ink-200 rounded-lg px-3 py-2.5 text-sm bg-white";

export default function CadastroPage({ searchParams }: { searchParams: { erro?: string; modo?: string } }) {
  const modo = searchParams.modo === "equipe" ? "equipe" : "nova";
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-panel p-7">
        <div className="flex justify-center mb-6"><LogoAxis className="h-9" /></div>

        <div className="grid grid-cols-2 gap-2 mb-6" role="tablist">
          <Link role="tab" aria-selected={modo === "nova"} href="/cadastro?modo=nova"
            className={"text-center rounded-lg py-2.5 text-sm font-medium border " + (modo === "nova" ? "bg-primaryDark text-white border-primaryDark" : "border-ink-200 text-ink-600")}>
            Nova construtora
          </Link>
          <Link role="tab" aria-selected={modo === "equipe"} href="/cadastro?modo=equipe"
            className={"text-center rounded-lg py-2.5 text-sm font-medium border " + (modo === "equipe" ? "bg-primaryDark text-white border-primaryDark" : "border-ink-200 text-ink-600")}>
            Entrar numa equipe
          </Link>
        </div>

        {modo === "nova" ? (
          <form action={criarConstrutora} className="space-y-3">
            <p className="text-sm text-ink-500 mb-1">Crie a conta da sua construtora e teste o Axis por 30 dias. Você será o administrador.</p>
            <label className="block text-sm">Nome da construtora<input name="nomeConstrutora" required className={campo + " mt-1"} /></label>
            <label className="block text-sm">CNPJ (opcional)<input name="cnpj" inputMode="numeric" className={campo + " mt-1"} /></label>
            <label className="block text-sm">Seu nome completo<input name="nomeCompleto" required autoComplete="name" className={campo + " mt-1"} /></label>
            <label className="block text-sm">E-mail<input name="email" type="email" required autoComplete="email" className={campo + " mt-1"} /></label>
            <div className="text-sm">Senha (mín. 8 caracteres)<div className="mt-1"><PasswordField name="senha" required minLength={8} /></div></div>
            {searchParams.erro && <p className="text-sm text-red-600">{searchParams.erro}</p>}
            <button type="submit" className="w-full bg-primaryDark text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90 transition">Criar conta da construtora</button>
          </form>
        ) : (
          <form action={entrarNaEquipe} className="space-y-3">
            <p className="text-sm text-ink-500 mb-1">Peça o código de convite ao administrador da sua construtora. Seu acesso é liberado depois que ele aprovar.</p>
            <label className="block text-sm">Código de convite<input name="codigo" required className={campo + " mt-1 uppercase tracking-[0.3em]"} maxLength={8} /></label>
            <label className="block text-sm">Seu nome completo<input name="nomeCompleto" required autoComplete="name" className={campo + " mt-1"} /></label>
            <label className="block text-sm">E-mail<input name="email" type="email" required autoComplete="email" className={campo + " mt-1"} /></label>
            <div className="text-sm">Senha (mín. 8 caracteres)<div className="mt-1"><PasswordField name="senha" required minLength={8} /></div></div>
            <label className="block text-sm">Setor
              <Selecao name="setor" required className={campo + " mt-1"}>
                <option value="ESTAGIARIO">Estagiário</option>
                <option value="ENGENHEIRO">Engenheiro</option>
                <option value="ARQUITETO">Arquiteto</option>
                <option value="MESTRE_GERAL">Mestre geral</option>
                <option value="RH">RH</option>
                <option value="FINANCEIRO">Financeiro</option>
                <option value="ADMIN">Administrador</option>
              </Selecao>
            </label>
            {searchParams.erro && <p className="text-sm text-red-600">{searchParams.erro}</p>}
            <button type="submit" className="w-full bg-primaryDark text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90 transition">Solicitar acesso</button>
          </form>
        )}

        <p className="text-sm text-center text-ink-500 mt-5">
          Já tem conta? <Link href="/login" className="text-primaryDark font-semibold">Entrar</Link>
        </p>
      </div>
    </main>
  );
}
