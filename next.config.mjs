import path from 'path';

// --- DEFINIÇÃO DA CSP (Sintaxe segura) ---
const cspValue = [
  "default-src 'self';",

  // ✅ Libera scripts do domínio principal, scripts.clarity.ms e Vercel
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.clarity.ms https://scripts.clarity.ms *.vercel-insights.com;",

  // ✅ Estilos
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com;",

  // ✅ Libera imagens (incluindo c.clarity.ms)
  "img-src 'self' data: image.tmdb.org cdn.myanimelist.net i.imgur.com https://www.clarity.ms https://c.clarity.ms;",

  // ✅ Fontes
  "font-src 'self' fonts.gstatic.com;",

  // ✅ Permite conexões do Clarity (envio de dados)
  "connect-src 'self' *.neon.tech api.jikan.moe https://www.clarity.ms https://scripts.clarity.ms https://c.clarity.ms https://i.clarity.ms vitals.vercel-insights.com;",

  "frame-src 'self';",
].join(' ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspValue,
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "cdn.myanimelist.net",
        pathname: "/images/anime/**",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
        pathname: "/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
