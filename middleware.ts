// middleware.ts
import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from "@prisma/client";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    // [REMOVIDO] Logs de segurança removidos para produção
    // console.log('[Middleware] Running for path:', req.nextUrl.pathname); 
    // console.log('[Middleware] Token:', req.nextauth.token); 

    // Verifica se o utilizador está a tentar aceder ao dashboard
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!req.nextauth.token) {
          // Lógica de redirecionamento explícito se necessário
      } else if (req.nextauth.token.role !== UserRole.CREATOR) {
          return NextResponse.redirect(new URL('/', req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
          const isAuthorized = !!token;
          return isAuthorized;
      }
    },
    pages: {
        signIn: '/auth/signin',
    }
  }
);

export const config = { matcher: ['/dashboard/:path*'] };