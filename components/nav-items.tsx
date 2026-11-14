import type { LucideIcon } from "lucide-react";
import { moduloDeCaminho } from "@/lib/acessos/modulos";
import {
  LayoutDashboard,
  UserCheck,
  Building2,
  Briefcase,
  Users,
  ClipboardList,
  Wallet,
  FileCheck2,
  BarChart3,
  History,
  Archive,
  HardHat,
  Handshake,
  ClipboardPen,
  CheckCheck,
  FileSpreadsheet,
  Home,
  Coins,
  Settings,
  ClipboardCheck,
  KeyRound,
  LifeBuoy,
  CalendarDays,
  Database,
} from "lucide-react";

// Setores do menu (coluna de ícones, no estilo do Sienge). Cada item de navegação pertence a um setor e a um grupo dentro dele.
export type SecaoId = "inicio" | "obras" | "medicoes" | "contratos" | "financeiro" | "admin";

export type Secao = {
  id: SecaoId;
  label: string;
  icon: LucideIcon;
  href?: string; // setor sem painel: o ícone leva direto à página (ex.: Início)
};

export const SECOES: Secao[] = [
  { id: "inicio", label: "Início", icon: Home, href: "/dashboard" },
  { id: "obras", label: "Obras", icon: HardHat },
  { id: "medicoes", label: "Medições e Vales", icon: ClipboardList },
  { id: "contratos", label: "Contratos", icon: Handshake },
  { id: "financeiro", label: "Financeiro", icon: Coins },
  { id: "admin", label: "Administração", icon: Settings },
];

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  secao: SecaoId; // setor do menu
  grupo: string; // grupo dentro do setor
  allowedSetores?: string[]; // undefined = todos os setores aprovados
  badgeKey?: "contratosPendentes"; // contador exibido ao lado do item
  extra?: string; // permissão específica que também libera o item (além dos setores)
  externo?: boolean; // página fora do Next (ex.: módulo estático Pós-obra): abre com link comum, não com o roteador
};

// Fonte única da navegação — usada pela Sidebar, pelo Breadcrumbs e pelos atalhos do Painel, para não
// repetir a lógica de "quem pode ver o quê" espalhada pelas páginas.
export const NAV_ITEMS: NavItem[] = [
  { label: "Painel", href: "/dashboard", icon: LayoutDashboard, description: "Visão geral", secao: "inicio", grupo: "Início" },

  // ---- Obras ----
  {
    label: "Cadastro de Obras",
    href: "/obras",
    icon: HardHat,
    description: "Cadastrar obras e informar se estão em andamento, concluídas ou entregues.",
    secao: "obras",
    grupo: "Obras",
  },

  // ---- Medições e Vales (mão de obra própria) ----
  {
    label: "Lançamentos",
    href: "/lancamentos",
    icon: ClipboardList,
    description: "Registrar medições e vales por pessoa/obra, com aprovação.",
    secao: "medicoes",
    grupo: "Lançamentos",
  },
  {
    label: "Fechamento mensal",
    href: "/admin/fechamento",
    icon: FileCheck2,
    description: "Finalizar o mês: gera o PDF assinado e envia por email.",
    allowedSetores: ["ADMIN"],
    secao: "medicoes",
    grupo: "Fechamento",
  },

  // ---- Contratos (empresas terceirizadas) ----
  {
    label: "Cadastro de Terceirizado",
    href: "/admin/empresas",
    icon: Briefcase,
    description: "Cadastrar e gerenciar empresas de serviços terceirizados.",
    allowedSetores: ["ADMIN"],
    secao: "contratos",
    grupo: "Cadastros",
  },
  {
    label: "Contratos",
    href: "/contratos",
    icon: Handshake,
    description: "Contratos de todas as obras: itens, aditivos, retenção e saldo.",
    allowedSetores: ["ADMIN", "ENGENHEIRO", "ESTAGIARIO", "FINANCEIRO"],
    secao: "contratos",
    grupo: "Cadastros",
  },
  {
    label: "Medições",
    href: "/contratos/medicoes",
    icon: ClipboardPen,
    description: "Medir um contrato já cadastrado (medições, vales e vales de medição).",
    allowedSetores: ["ADMIN", "ENGENHEIRO", "ESTAGIARIO"],
    secao: "contratos",
    grupo: "Execução",
  },
  {
    label: "Autorização",
    href: "/contratos/aprovacoes",
    icon: CheckCheck,
    description: "ADM confere o que foi medido e autoriza ou não (com glosa), e as solicitações de aditivo.",
    allowedSetores: ["ADMIN"],
    badgeKey: "contratosPendentes",
    secao: "contratos",
    grupo: "Execução",
  },
  {
    label: "Fechamento",
    href: "/contratos/fechamento",
    icon: FileSpreadsheet,
    description: "Fechar o mês do contrato e gerar o PDF da medição aprovada.",
    allowedSetores: ["ADMIN"],
    secao: "contratos",
    grupo: "Execução",
  },
  {
    label: "Histórico",
    href: "/contratos/historico",
    icon: Archive,
    description: "PDFs das medições já fechadas, de todos os contratos.",
    allowedSetores: ["ADMIN", "FINANCEIRO"],
    secao: "contratos",
    grupo: "Execução",
  },

  // ---- Administração de acessos (só o gestor, pela permissão "gestor_acessos") ----
  {
    label: "Acessos",
    href: "/admin/acessos",
    icon: KeyRound,
    description: "Liberar e retirar módulos de cada pessoa, e responder pedidos de acesso.",
    allowedSetores: [],
    extra: "gestor_acessos",
    secao: "admin",
    grupo: "Acessos e permissões",
  },

  // ---- Financeiro ----
  {
    label: "Dashboard de gastos",
    href: "/financeiro/dashboard",
    icon: BarChart3,
    description: "Gasto por obra, total a pagar por obra no fim do mês e evolução dos últimos 6 meses.",
    allowedSetores: ["ADMIN", "FINANCEIRO"],
    secao: "financeiro",
    grupo: "Painéis",
  },
  {
    label: "Retiradas de retido",
    href: "/financeiro/retiradas",
    icon: Wallet,
    description: "Lançar retiradas, saldo inicial e saldo disponível por pessoa.",
    allowedSetores: ["ADMIN", "FINANCEIRO"],
    secao: "financeiro",
    grupo: "Retidos",
  },

  // ---- Administração ----
  {
    label: "Serviços e retenção",
    href: "/admin/obras",
    icon: Building2,
    description: "Serviços e preços por obra, retenção mensal e empresas contratadas.",
    allowedSetores: ["ADMIN"],
    secao: "admin",
    grupo: "Cadastros",
  },
  {
    label: "RH & Pessoas",
    href: "/rh/pessoas",
    icon: Users,
    description: "Cadastrar empreiteiros/mestres, transferir e dar baixa.",
    allowedSetores: ["ADMIN", "RH"],
    secao: "admin",
    grupo: "Cadastros",
  },
  {
    label: "Dados da construtora",
    href: "/construtora",
    icon: Building2,
    description: "Nome, CNPJ, logotipo usado nos PDFs e código de convite da equipe.",
    allowedSetores: ["ADMIN"],
    secao: "admin",
    grupo: "Minha empresa",
  },
  {
    label: "Licença e mensalidades",
    href: "/conta",
    icon: Wallet,
    description: "Plano contratado, outros planos e histórico de mensalidades.",
    allowedSetores: ["ADMIN"],
    secao: "admin",
    grupo: "Minha empresa",
  },
  {
    label: "Aprovação de logins",
    href: "/admin/aprovacoes",
    icon: UserCheck,
    description: "Aprovar ou rejeitar cadastros pendentes.",
    allowedSetores: ["ADMIN"],
    secao: "admin",
    grupo: "Acessos e permissões",
  },
  {
    label: "Log de auditoria",
    href: "/admin/auditoria",
    icon: History,
    description: "Histórico de quem criou, editou ou excluiu lançamentos.",
    allowedSetores: ["ADMIN"],
    secao: "admin",
    grupo: "Auditoria",
  },
];

export function navItemsForSetor(setor: string | null, extras: string[] = []): NavItem[] {
  // Módulos (andamento, pós-obra, contratos, lançamentos, financeiro) aparecem para todos;
  // quem não tem acesso vê a tela "sem acesso" ao abrir (ver components/AppShell.tsx).
  return NAV_ITEMS.filter(
    (item) =>
      moduloDeCaminho(item.href) !== null ||
      !item.allowedSetores ||
      (setor && item.allowedSetores.includes(setor)) ||
      (item.extra && extras.includes(item.extra))
  );
}

// item que corresponde à página aberta: o de href mais longo (ex.: /contratos/medicoes ganha de /contratos)
export function itemDaRota(items: NavItem[], pathname: string): NavItem | null {
  let melhor: NavItem | null = null;
  for (const it of items) {
    if (pathname === it.href || pathname.startsWith(it.href + "/")) if (!melhor || it.href.length > melhor.href.length) melhor = it;
  }
  return melhor;
}

// menu por setor: só entram os setores e grupos que têm pelo menos um item liberado para a pessoa
export type GrupoMenu = { nome: string; itens: NavItem[] };
export type SecaoMenu = Secao & { grupos: GrupoMenu[]; total: number };
export function menuPorSetor(setor: string | null, extras: string[] = []): SecaoMenu[] {
  const items = navItemsForSetor(setor, extras);
  return SECOES.map((s) => {
    const dela = items.filter((i) => i.secao === s.id);
    const grupos: GrupoMenu[] = [];
    dela.forEach((i) => {
      let g = grupos.find((x) => x.nome === i.grupo);
      if (!g) grupos.push((g = { nome: i.grupo, itens: [] }));
      g.itens.push(i);
    });
    return { ...s, grupos, total: dela.length };
  }).filter((s) => s.href || s.total > 0);
}
