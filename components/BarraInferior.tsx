"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, HardHat, ClipboardList, Handshake, Menu } from "lucide-react";

// Barra de abas inferior para iPhone e iPad em pé (telas < 1024 px), como um app nativo.
// Respeita a área segura do iPhone (barra do gesto de início).
const ABAS = [
  { href: "/dashboard", rotulo: "Início", icone: Home },
  { href: "/obras", rotulo: "Obras", icone: HardHat },
  { href: "/lancamentos", rotulo: "Lançar", icone: ClipboardList },
  { href: "/contratos", rotulo: "Contratos", icone: Handshake },
];

export default function BarraInferior({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="lg:hidden print:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5 max-w-2xl mx-auto">
        {ABAS.map(({ href, rotulo, icone: Icone }) => {
          const ativo = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={"flex flex-col items-center justify-center gap-1 min-h-[56px] text-[11px] font-medium transition-colors " + (ativo ? "text-primaryDark" : "text-ink-400")}
              >
                <Icone className="w-[22px] h-[22px]" strokeWidth={ativo ? 2.2 : 1.8} aria-hidden />
                {rotulo}
              </Link>
            </li>
          );
        })}
        <li>
          <button type="button" onClick={onMenu} className="w-full flex flex-col items-center justify-center gap-1 min-h-[56px] text-[11px] font-medium text-ink-400" aria-label="Abrir o menu completo">
            <Menu className="w-[22px] h-[22px]" strokeWidth={1.8} aria-hidden />
            Menu
          </button>
        </li>
      </ul>
    </nav>
  );
}
