// next.config.mjs

import path from 'path';

// --- DEFINIÇÃO DA CSP (Sintaxe segura) ---
const cspValue = [
  "default-src 'self';",

  // ✅ Libera scripts do domínio principal, scripts.clarity.ms e Vercel
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.clarity.ms https://scripts.clarity.ms *.vercel-insights.com;",

  // ✅ Estilos
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com;",

  // --- [CORREÇÃO AQUI: Adicionado 'blob:'] ---
  // Permite URLs temporários (blob:) para a pré-visualização do avatar
  "img-src 'self' data: blob: image.tmdb.org cdn.myanimelist.net i.imgur.com https://www.clarity.ms https://c.clarity.ms c.bing.com *.public.blob.vercel-storage.com;",

  // ✅ Fontes
  "font-src 'self' fonts.gstatic.com;",

  // ✅ Permite conexões (incluindo Vercel Blob)
  "connect-src 'self' *.neon.tech api.jikan.moe https://www.clarity.ms https://scripts.clarity.ms https://c.clarity.ms https://i.clarity.ms vitals.vercel-insights.com *.public.blob.vercel-storage.com;",

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
      // Domínio do Vercel Blob (já estava correto)
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },

  async headers() {
    return [
      {
        // Aplica os cabeçalhos de segurança (CSP) a todas as rotas
        source: "/:path*",
        headers: securityHeaders,
      },
      // --- [INÍCIO DA NOVA SEÇÃO DE CORS] ---
      {
        // Aplica os cabeçalhos de CORS APENAS às suas rotas de API
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            // Permite o seu localhost de testes
            value: "http://localhost:3000", 
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
        ],
      },
      // --- [FIM DA NOVA SEÇÃO DE CORS] ---
    ];
  },
};

export default nextConfig;