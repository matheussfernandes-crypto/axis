import { redirect } from "next/navigation";
import { getCurrentUserProfile, getEmpresaAtual } from "@/lib/auth/getCurrentUserProfile";
import AppShell from "@/components/AppShell";
import AvisoEmpresa from "@/components/AvisoEmpresa";

// Shell único para todas as páginas autenticadas: busca o perfil UMA vez aqui
// (em vez de cada página + o Topbar antigo repetirem a mesma consulta) e
// garante a barra lateral em todo lugar, sem precisar copiar <Topbar/> em
// cada página.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [profile, empresa] = await Promise.all([getCurrentUserProfile(), getEmpresaAtual()]);

  if (!profile) {
    // O middleware só checa se existe cookie de sessão, não se ela ainda é
    // válida. Se getUser() falhou mesmo com o cookie presente (sessão
    // expirada/inválida), é preciso limpar o cookie de verdade antes de ir
    // pro /login — mas Server Components não conseguem gravar/limpar cookies
    // no Next.js, só Server Actions e Route Handlers. Por isso passamos por
    // /auth/limpar-sessao (Route Handler) em vez de redirecionar direto —
    // senão o middleware continua vendo "logado" e manda de volta pro
    // dashboard, causando ERR_TOO_MANY_REDIRECTS.
    redirect("/auth/limpar-sessao");
  }
  if (profile.status !== "aprovado") redirect("/aguardando-aprovacao");
  // empresa ainda não aceita pelo dono do Axis, suspensa ou cancelada: ninguém dela entra (o dono do Axis sempre entra)
  if (empresa && !empresa.ehAxisAdmin && ["PENDENTE", "SUSPENSO", "CANCELADO"].includes(empresa.plano)) redirect("/aguardando-aprovacao");

  const extras = [...profile.acessos, ...(profile.setor === "ADMIN" ? ["gestor_acessos"] : []), ...(empresa?.ehAxisAdmin ? ["axis_plataforma"] : [])];
  const emOutra = !!empresa && empresa.ehAxisAdmin && empresa.id !== empresa.propriaId;

  return (
    <AppShell setor={profile.setor} extras={extras} nome={profile.nome} naoLidas={profile.naoLidas} contadores={{ contratosPendentes: profile.contratosPendentes }}>
      {emOutra && <AvisoEmpresa nome={empresa!.nome} propria={empresa!.propriaNome} />}
      {children}
    </AppShell>
  );
}
