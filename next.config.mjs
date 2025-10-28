import path from 'path';

// --- DEFINIÇÃO DA CSP (Sintaxe segura) ---
const cspValue = [
  "default-src 'self';",
  // Permite scripts do nosso domínio, eval(), scripts inline, e Vercel Analytics
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-insights.com;",
  // Permite estilos do nosso domínio, inline, e Google Fonts
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com;",

  // --- [MUDANÇA AQUI] ---
  // Permite imagens do nosso domínio, data:, TMDB, MyAnimeList e Imgur
  "img-src 'self' data: image.tmdb.org cdn.myanimelist.net i.imgur.com;",
  // --- FIM DA MUDANÇA ---

  // Permite fontes do nosso domínio e Google Fonts
  "font-src 'self' fonts.gstatic.com;",
  // Permite ligações (fetch/XHR) para o nosso domínio, Neon, Jikan, e Vercel
  "connect-src 'self' *.neon.tech api.jikan.moe vitals.vercel-insights.com;",
  "frame-src 'self';",
].join(' '); // Junta tudo numa só linha, separado por espaços

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspValue
  }
];
// ----------------------------------------

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração de Imagens
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
      // --- [MUDANÇA AQUI] ---
      // Adiciona o domínio de imagens diretas do Imgur
      {
        protocol: "https",
        hostname: "i.imgur.com",
        port: "",
        pathname: "/**", // Permite qualquer imagem desse domínio
      },
      // --- FIM DA MUDANÇA ---
    ],
  },

  // Função 'headers' para aplicar o CSP
  async headers() {
    return [
      {
        source: '/:path*', // Aplica a todas as rotas
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
