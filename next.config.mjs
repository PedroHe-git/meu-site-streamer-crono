// next.config.mjs

import path from 'path';

// --- DEFINIÇÃO DA CSP (Sintaxe segura) ---
const cspValue = [
  "default-src 'self';",

  // 1. ADICIONADO: embed.twitch.tv e player.twitch.tv para carregar o script do player
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://embed.twitch.tv https://player.twitch.tv https://www.clarity.ms https://scripts.clarity.ms *.vercel-insights.com;",

  "style-src 'self' 'unsafe-inline' fonts.googleapis.com;",

  // 2. ADICIONADO: static-cdn.jtvnw.net para imagens da Twitch (thumbnails/avatar)
  "img-src 'self' data: blob: image.tmdb.org cdn.myanimelist.net i.imgur.com images.igdb.com s4.anilist.co https://static-cdn.jtvnw.net https://*.twitch.tv https://www.clarity.ms https://c.clarity.ms c.bing.com *.public.blob.vercel-storage.com;",

  "font-src 'self' fonts.gstatic.com;",

  "connect-src 'self' *.neon.tech api.jikan.moe graphql.anilist.co https://www.clarity.ms https://scripts.clarity.ms https://c.clarity.ms https://i.clarity.ms https://n.clarity.ms vitals.vercel-insights.com *.public.blob.vercel-storage.com;",

  // 3. ADICIONADO: player.twitch.tv e www.twitch.tv para permitir o iframe do vídeo
  "frame-src 'self' https://player.twitch.tv https://www.twitch.tv https://embed.twitch.tv;",
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
    value: 'DENY'
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
      {
        protocol: "https",
        hostname: "images.igdb.com",
        pathname: "/igdb/image/upload/**",
      },
      {
        protocol: "https",
        hostname: "s4.anilist.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      // ADICIONADO: Para garantir que avatares da Twitch funcionem no componente Image do Next.js
      {
        protocol: "https",
        hostname: "static-cdn.jtvnw.net",
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