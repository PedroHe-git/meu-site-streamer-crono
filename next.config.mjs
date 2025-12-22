// next.config.mjs

import path from 'path';

// --- DEFINIÇÃO DA CSP (Sintaxe segura) ---
const cspValue = [
  "default-src 'self';",

  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://embed.twitch.tv https://player.twitch.tv https://www.clarity.ms https://scripts.clarity.ms *.vercel-insights.com;",

  "style-src 'self' 'unsafe-inline' fonts.googleapis.com;",

  // 1. ADICIONADO: https://img.youtube.com para permitir carregar thumbnails na CSP
  "img-src 'self' data: blob: image.tmdb.org cdn.myanimelist.net i.imgur.com images.igdb.com s4.anilist.co https://static-cdn.jtvnw.net https://*.twitch.tv https://img.youtube.com https://www.clarity.ms https://c.clarity.ms c.bing.com *.public.blob.vercel-storage.com;",

  "font-src 'self' fonts.gstatic.com;",

  "connect-src 'self' *.neon.tech api.jikan.moe graphql.anilist.co https://www.clarity.ms https://scripts.clarity.ms https://c.clarity.ms https://i.clarity.ms https://n.clarity.ms vitals.vercel-insights.com *.public.blob.vercel-storage.com;",

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
      {
        protocol: "https",
        hostname: "static-cdn.jtvnw.net",
        pathname: "/**",
      },
      // 2. ADICIONADO: Configuração para o Next/Image aceitar o YouTube
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/vi/**",
      },
      { protocol: "https", hostname: "i.ytimg.com" },      // YouTube Thumbs
      { protocol: "https", hostname: "yt3.ggpht.com" },    // YouTube Avatar
      { protocol: "https", hostname: "m.media-amazon.com" }, // Amazon
      { protocol: "https", hostname: "images-na.ssl-images-amazon.com" }, // Amazon Antigo
      { protocol: "https", hostname: "static-cdn.jtvnw.net" }, // Twitch
      { protocol: "https", hostname: "cdn.discordapp.com" },   // Discord
      { protocol: "https", hostname: "pbs.twimg.com" },        // Twitter
      { protocol: "https", hostname: "scontent.cdninstagram.com" }, // Instagram
      { protocol: "https", hostname: "scontent-gru1-1.cdninstagram.com" }, // Insta BR 1
      { protocol: "https", hostname: "scontent-gru2-1.cdninstagram.com" }, // Insta BR 2
      // Adicione este abaixo para garantir (scontent geral)
      { protocol: "https", hostname: "*.cdninstagram.com" },
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