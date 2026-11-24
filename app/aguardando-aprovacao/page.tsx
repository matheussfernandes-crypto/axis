import { createClient } from "@/lib/supabase/server";
import { sair } from "../auth-actions";

export default async function AguardandoAprovacaoPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let status: string | null = null;
  let plano: string | null = null;
  if (user) {
    const { data: perfil } = await supabase.from("perfis").select("status").eq("id", user.id).single();
    status = perfil?.status ?? null;
    const { data: sit } = await supabase.rpc("empresa_situacao");
    const e = Array.isArray(sit) ? sit[0] : sit;
    plano = e?.plano ?? null;
  }

  const rejeitado = status === "rejeitado";
  const desativado = status === "desativado";
  // Empresa ainda não aceita pelo Axis, ou suspensa/cancelada
  const empresaPendente = !rejeitado && !desativado && plano === "PENDENTE";
  const empresaBloqueada = !rejeitado && !desativado && (plano === "SUSPENSO" || plano === "CANCELADO");

  const titulo = desativado ? "Acesso desativado"
    : rejeitado ? "Cadastro rejeitado"
    : empresaPendente ? "Empresa em análise"
    : empresaBloqueada ? "Acesso da empresa suspenso"
    : "Cadastro pendente";
  const texto = desativado
    ? "Seu acesso a este sistema foi desativado pelo ADM. Fale com o responsável se acredita que isso é um engano."
    : rejeitado
    ? "Seu cadastro foi rejeitado pelo ADM. Fale com o responsável se acredita que isso é um engano."
    : empresaPendente
    ? "O cadastro da sua empresa foi recebido e está em análise pela equipe do Axis. Assim que for aprovado, você terá acesso liberado."
    : empresaBloqueada
    ? "O acesso da sua empresa ao Axis está suspenso. Fale com a equipe do Axis para reativar."
    : "Seu cadastro foi enviado e está aguardando aprovação do ADM. Você receberá acesso assim que for aprovado.";

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-6 text-center">
        <h1 className="text-xl font-semibold text-primaryDark mb-2">{titulo}</h1>
        <p className="text-sm text-gray-600 mb-4">{texto}</p>
        <form action={sair}>
          <button type="submit" className="text-sm text-primaryDark font-semibold">
            Sair
          </button>
        </form>
      </div>
    </main>
  );
}
