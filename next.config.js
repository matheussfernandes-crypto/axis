/** @type {import('next').NextConfig} */

// Cabeçalhos de segurança aplicados em todas as páginas
const seguranca = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

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
    return [{ source: "/(.*)", headers: seguranca }];
  },
};

module.exports = nextConfig;
