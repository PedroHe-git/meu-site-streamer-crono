import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from "@prisma/client";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    
    // --- MODO DE MANUTENÇÃO ---
    // Se ativado, bloqueia TUDO que não seja arquivo estático.
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
                    background-color: #0f172a;
                    color: #e2e8f0;
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
                h1 { margin-bottom: 1rem; color: #fbbf24; }
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
        { 
            status: 503, 
            headers: { "content-type": "text/html" } 
        }
      );
    }

    // --- LÓGICA NORMAL (Só executa se NÃO estiver em manutenção) ---
    const path = req.nextUrl.pathname;
    const token = req.nextauth.token;

    // Proteção do Dashboard
    if (path.startsWith('/dashboard')) {
      if (!token) {
         // Redireciona para login se não houver token
         return NextResponse.redirect(new URL('/auth/signin', req.url));
      } 
      if (token.role !== UserRole.CREATOR) {
         // Redireciona para home se não for criador
         return NextResponse.redirect(new URL('/', req.url));
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Se estiver em manutenção, liberamos a autorização para que o middleware (acima)
        // possa capturar a requisição e mostrar a tela de manutenção HTML.
        // Se retornarmos 'false' aqui, o NextAuth força o redirecionamento para '/auth/signin'
        // ANTES de mostrarmos a tela de manutenção.
        if (process.env.MAINTENANCE_MODE === "true") {
            return true; 
        }

        // Lógica normal de proteção de rotas
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
            return !!token;
        }
        return true; 
      }
    },
    pages: {
        signIn: '/auth/signin',
    }
  }
);

export const config = {
  // O matcher DEVE excluir arquivos estáticos (favicon, _next, imagens)
  // Se não excluir, o middleware bloqueia o CSS e a página fica sem estilo.
  matcher: [
    "/dashboard/:path*",
    "/profile/settings/:path*",
    // A linha abaixo é o segredo: nega tudo que tem ponto (.) como .css, .png, etc
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};