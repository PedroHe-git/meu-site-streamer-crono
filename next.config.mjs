import path from 'path';

// --- DEFINIÇÃO DA CSP (Sintaxe segura) ---
const cspValue = [
  "default-src 'self';",

  // ✅ Permite scripts do nosso domínio, eval(), scripts inline, Clarity e Vercel Analytics
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.clarity.ms *.vercel-insights.com;",

  // Permite estilos do nosso domínio, inline, e Google Fonts
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com;",

  // ✅ Permite imagens do nosso domínio, data:, TMDB, MyAnimeList, Imgur e Clarity
  "img-src 'self' data: image.tmdb.org cdn.myanimelist.net i.imgur.com https://www.clarity.ms;",

  // Permite fontes do nosso domínio e Google Fonts
  "font-src 'self' fonts.gstatic.com;",

  // ✅ Permite ligações (fetch/XHR) para o nosso domínio, Neon, Jikan, Clarity e Vercel
  "connect-src 'self' *.neon.tech api.jikan.moe https://www.clarity.ms vitals.vercel-insights.com;",

  "frame-src 'self';",
].join(' ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspValue,
  },
];

// ----------------------------------------

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        port: "",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "cdn.myanimelist.net",
        port: "",
        pathname: "/images/anime/**",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
        port: "",
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
