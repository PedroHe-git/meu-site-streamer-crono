import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from "@prisma/client";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    console.log('[Middleware] Running for path:', req.nextUrl.pathname); // Log path
    console.log('[Middleware] Token:', req.nextauth.token); // Log token details

    // Verifica se o utilizador está a tentar aceder ao dashboard
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      // Verifica se o token existe e se a role NÃO é CREATOR
      if (!req.nextauth.token) {
          console.log('[Middleware] No token found, redirecting to login.');
          // Redireciona para login (withAuth faz isso se authorized retornar false)
          // Mas podemos ser explícitos se quisermos
          // const loginUrl = new URL('/auth/signin', req.url);
          // loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
          // return NextResponse.redirect(loginUrl);
      } else if (req.nextauth.token.role !== UserRole.CREATOR) {
          console.log(`[Middleware] Role is ${req.nextauth.token.role}, not CREATOR. Redirecting to home.`);
          // Redireciona para a página inicial
          return NextResponse.redirect(new URL('/', req.url));
      } else {
          console.log('[Middleware] Role is CREATOR, allowing access to dashboard.');
      }
    }
    // Permite continuar para outras rotas ou se for CREATOR no dashboard
    return NextResponse.next();
  },
  {
    callbacks: {
      // Verifica apenas se o token existe. A lógica de role está no middleware principal.
      authorized: ({ token }) => {
          const isAuthorized = !!token;
          console.log('[Middleware Authorized Callback] Token exists:', isAuthorized);
          return isAuthorized;
      }
    },
     // Define a página de login para onde o withAuth redireciona se !token
    pages: {
        signIn: '/auth/signin',
    }
  }
);

// Aplica o middleware APENAS às rotas do dashboard
export const config = { matcher: ['/dashboard/:path*'] };

