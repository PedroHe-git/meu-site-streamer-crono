import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const UserRole = {
  CREATOR: 'CREATOR',
  USER: 'USER',
} as const;

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    
    // --- 1. MODO DE MANUTENÇÃO ---
    if (process.env.MAINTENANCE_MODE === "true") {
      return new NextResponse(
        `<!DOCTYPE html><html lang="pt-BR"><head><title>Manutenção</title></head><body><h1>Em Manutenção</h1></body></html>`,
        { status: 503, headers: { "content-type": "text/html" } }
      );
    }

    // --- 2. PROTEÇÃO DE ROTAS ---
    const path = req.nextUrl.pathname;
    const token = req.nextauth.token;

    if (path.startsWith('/dashboard')) {
      if (!token) return NextResponse.redirect(new URL('/auth/signin', req.url));
      if (token.role !== UserRole.CREATOR) return NextResponse.redirect(new URL('/', req.url));
    }
    
    // --- 3. CABEÇALHOS DE SEGURANÇA (CORRIGIDOS) ---
    const response = NextResponse.next();

    // 👇 AQUI ESTÁ A CORREÇÃO MÁGICA PARA O INSTAGRAM
    // "unsafe-none" diz ao navegador: "Não bloqueie recursos externos que não tenham credenciais CORS"
    response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    // Política de Referência (Opcional, ajuda a carregar imagens bloqueadas por hotlink)
    response.headers.set('Referrer-Policy', 'no-referrer');

    // CSP (Content Security Policy) Atualizada
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com https://player.twitch.tv https://*.twitch.tv;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' blob: data: https: https://*.googleusercontent.com https://image.tmdb.org https://i.ytimg.com https://yt3.ggpht.com https://*.cdninstagram.com https://*.fbcdn.net https://*.fna.fbcdn.net https://static-cdn.jtvnw.net https://*.twitch.tv https://*.vercel-storage.com https://wsrv.nl;
      font-src 'self' data: https://fonts.gstatic.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      frame-src 'self' https://www.youtube.com https://player.twitch.tv https://www.instagram.com;
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    response.headers.set('Content-Security-Policy', cspHeader);

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (process.env.MAINTENANCE_MODE === "true") return true;
        if (req.nextUrl.pathname.startsWith('/dashboard')) return !!token;
        return true; 
      }
    },
    pages: { signIn: '/auth/signin' }
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) -> Mantenha API se você precisa proteger rotas de API
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - imagens na public (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};