import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from "@prisma/client";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    // --- [NOVO] MODO DE MANUTENÇÃO ---
    // Se a variável de ambiente MAINTENANCE_MODE for "true", bloqueia o acesso
    // Exceção: Não bloqueia assets estáticos (_next, imagens, favicon)
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
        { 
            status: 503, 
            headers: { "content-type": "text/html" } 
        }
      );
    }
    // --------------------------------

    // [REMOVIDO] Logs de segurança removidos para produção
    // console.log('[Middleware] Running for path:', req.nextUrl.pathname); 
    // console.log('[Middleware] Token:', req.nextauth.token); 

    // Verifica se o utilizador está a tentar aceder ao dashboard
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!req.nextauth.token) {
          // Lógica de redirecionamento explícito se necessário (o withAuth já lida com isso via 'pages')
      } else if (req.nextauth.token.role !== UserRole.CREATOR) {
          return NextResponse.redirect(new URL('/', req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
          // --- AJUSTE IMPORTANTE ---
          // Se estiver em modo de manutenção, liberamos o "authorized" para que o middleware execute
          // e caia no IF de manutenção acima. Se retornarmos false aqui, o NextAuth redireciona
          // para login antes de mostrarmos a tela de manutenção.
          if (process.env.MAINTENANCE_MODE === "true") return true;

          // Lógica normal:
          // O middleware roda em toda a aplicação (conforme matcher),
          // mas só queremos forçar login no Dashboard.
          // Para outras rotas, deixamos passar (token pode ser null).
          
          // OBS: A config 'matcher' abaixo define onde o middleware roda.
          // Se rodar apenas em /dashboard, o usuario nao logado vai para o login.
          // Se rodar em tudo, precisamos permitir acesso público à home.
          
          // Como seu matcher pega '/dashboard/:path*', esta função authorized
          // só é crítica para essas rotas protegidas.
          const isAuthorized = !!token;
          return isAuthorized;
      }
    },
    pages: {
        signIn: '/auth/signin',
    }
  }
);

export const config = { 
    // Matcher expandido para pegar TODAS as rotas e aplicar a manutenção globalmente
    // Exclui arquivos estáticos, imagens e favicon para não quebrar o layout
    matcher: [
        '/dashboard/:path*', 
        '/api/:path*', 
        '/((?!_next/static|_next/image|favicon.ico|auth/signin).*)' 
    ] 
};