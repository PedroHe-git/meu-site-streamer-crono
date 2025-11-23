import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from "@prisma/client";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    // --- MODO DE MANUTENÇÃO ---
    if (process.env.MAINTENANCE_MODE === "true") {
      return new NextResponse(
        `<!DOCTYPE html><html lang="pt-BR">... (seu HTML de manutenção aqui) ...</html>`,
        { status: 503, headers: { "content-type": "text/html" } }
      );
    }
    
    const path = req.nextUrl.pathname;
    const token = req.nextauth.token;

    // 1. Proteção do Dashboard (Apenas Criadores Logados)
    if (path.startsWith('/dashboard')) {
      if (!token) {
         // O withAuth já redireciona para login se retornar false no 'authorized', 
         // mas aqui garantimos a lógica de role
         return NextResponse.redirect(new URL('/auth/signin', req.url));
      } 
      if (token.role !== UserRole.CREATOR) {
         // Se logado mas não for criador, manda para home
         return NextResponse.redirect(new URL('/', req.url));
      }
    }
    
    // 2. Se for qualquer outra rota pública (Home, Perfil, etc), permite passar.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // --- CORREÇÃO CRÍTICA ---
        // Se for rota de dashboard, EXIGE token.
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
            return !!token;
        }
        // Para TODAS as outras rotas (Home, Perfil, etc), PERMITE acesso mesmo sem token.
        return true; 
      }
    },
    pages: {
        signIn: '/auth/signin',
    }
  }
);

export const config = { 
    // O matcher agora observa tudo para aplicar o modo manutenção se necessário,
    // mas a lógica de 'authorized' acima libera o acesso público.
    matcher: [
        '/dashboard/:path*', 
        '/api/:path*', 
        // O matcher negativo abaixo garante que o middleware rode na home '/',
        // mas ignora arquivos estáticos
        '/((?!_next/static|_next/image|favicon.ico|auth/signin|auth/register).*)' 
    ] 
};