/** @type {import('next').NextConfig} */

// Cabeçalhos de segurança aplicados em todas as páginas
const seguranca = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

// Rotas de PDF: precisam ser exibidas dentro de um <iframe> da própria página (janela de
// visualização em vez de navegar pra fora), então usam SAMEORIGIN em vez de DENY.
const segurancaPdf = seguranca.map((h) => (h.key === "X-Frame-Options" ? { ...h, value: "SAMEORIGIN" } : h));

const nextConfig = {
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
    // importa só os ícones usados (páginas mais leves)
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      { source: "/((?!.*\\/pdf$).*)", headers: seguranca },
      { source: "/:path*/pdf", headers: segurancaPdf },
    ];
  },
};

module.exports = nextConfig;
