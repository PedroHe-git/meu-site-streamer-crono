import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from "@prisma/client";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    // --- MODO DE MANUTENÇÃO ---
    // Se a variável de ambiente MAINTENANCE_MODE for "true", bloqueia o acesso
    // Retorna uma página HTML estilizada (Status 503 Service Unavailable)
    if (process.env.MAINTENANCE_MODE === "true") {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Em Manutenção - MeuCronograma</title>
            <style>
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #0f172a; /* Fundo escuro moderno */
                    color: #e2e8f0; /* Texto claro */
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    text-align: center;
                }
                .container {
                    padding: 2rem;
                    background-color: #1e293b;
                    border-radius: 1rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    max-width: 400px;
                }
                h1 { margin-bottom: 1rem; color: #fbbf24; } /* Amarelo */
                p { line-height: 1.5; margin-bottom: 1.5rem; }
                .icon { font-size: 3rem; margin-bottom: 1rem; display: block; }
            </style>
        </head>
        <body>
            <div class="container">
                <span class="icon">🚧</span>
                <h1>Estamos em Manutenção</h1>
                <p>O MeuCronograma está passando por uma pausa técnica para otimizar nossos recursos.</p>
                <p>Voltaremos com tudo no dia 01!</p>
                <small>Agradecemos a paciência.</small>
            </div>
        </body>
        </html>
        `,
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
        // mas ignora arquivos estáticos e rotas de autenticação
        '/((?!_next/static|_next/image|favicon.ico|auth/signin|auth/register).*)' 
    ] 
};