import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/space-grotesk/300.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "./globals.css";
import "./anima.css";
import "./tema-escuro.css";
import { SCRIPT_TEMA_INICIAL } from "@/lib/tema";
import type { Metadata, Viewport } from "next";
import PushRegistrar from "@/components/PushRegistrar";

export const metadata: Metadata = {
  title: { default: "Axis · Gestão de obras", template: "%s · Axis" },
  description: "Medições, vales e contratos da sua obra em um só lugar.",
  manifest: "/manifest.json",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // usa a tela inteira do iPhone (notch e barra de gesto) com áreas seguras
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0B" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* abertura da marca (uma vez por sessão; ?intro na URL força de novo) */}
        <link rel="stylesheet" href="/marca/intro.css" />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA_INICIAL }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("axisIntroVisto")&&location.search.indexOf("intro")<0)document.documentElement.classList.add("intro-done")}catch(e){}`,
          }}
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Axis" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
      </head>
      <body className="font-sans">
        <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: '<div id="intro" aria-label="Abrindo o Axis"></div>' }} />
        <script src="/marca/intro.js" />
        <PushRegistrar />
        {children}
      </body>
    </html>
  );
}
