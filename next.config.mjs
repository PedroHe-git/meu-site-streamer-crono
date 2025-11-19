// next.config.mjs

import path from 'path';

// --- DEFINIÇÃO DA CSP (Sintaxe segura) ---
const cspValue = [
  "default-src 'self';",

  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.clarity.ms https://scripts.clarity.ms *.vercel-insights.com;",

  "style-src 'self' 'unsafe-inline' fonts.googleapis.com;",

  // --- [CORREÇÃO 1: Adicionado 'images.igdb.com' na CSP] ---
  "img-src 'self' data: blob: image.tmdb.org cdn.myanimelist.net i.imgur.com images.igdb.com https://www.clarity.ms https://c.clarity.ms c.bing.com *.public.blob.vercel-storage.com;",

  "font-src 'self' fonts.gstatic.com;",

  "connect-src 'self' *.neon.tech api.jikan.moe https://www.clarity.ms https://scripts.clarity.ms https://c.clarity.ms https://i.clarity.ms https://n.clarity.ms vitals.vercel-insights.com *.public.blob.vercel-storage.com;",

  "frame-src 'self';",
].join(' ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspValue,
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY' // Impede que seu site seja aberto num iframe (evita Clickjacking)
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
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
      // --- [CORREÇÃO 2: Adicionado Configuração do Next Image para IGDB] ---
      {
        protocol: "https",
        hostname: "images.igdb.com",
        pathname: "/igdb/image/upload/**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },

  async headers() {
    const PROD_URL = "https://meucronograma.live";
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NODE_ENV === "development" 
              ? "http://localhost:3000" 
              : PROD_URL,
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;