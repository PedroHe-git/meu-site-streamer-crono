import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// 1. Defina o Enum aqui ou em um arquivo leve separado (ex: lib/constants.ts)
// Evita importar o peso do @prisma/client no Edge
const UserRole = {
  CREATOR: 'CREATOR',
  USER: 'USER',
} as const;

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    
    // --- MODO DE MANUTENÇÃO ---
    if (process.env.MAINTENANCE_MODE === "true") {
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Em Manutenção</title>
            <style>
                body { background-color: #0f172a; color: #e2e8f0; font-family: sans-serif; display: flex; height: 100vh; align-items: center; justify-content: center; text-align: center; }
                .container { background: #1e293b; padding: 2rem; border-radius: 1rem; max-width: 400px; }
                h1 { color: #fbbf24; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚧 Em Manutenção</h1>
                <p>Voltaremos em breve!</p>
            </div>
        </body>
        </html>`,
        { status: 503, headers: { "content-type": "text/html" } }
      );
    }

    // --- LÓGICA DE PROTEÇÃO ---
    const path = req.nextUrl.pathname;
    const token = req.nextauth.token;

    // Proteção do Dashboard
    if (path.startsWith('/dashboard')) {
      // O withAuth já garante que 'token' existe, mas a verificação extra não faz mal
      if (!token) {
         return NextResponse.redirect(new URL('/auth/signin', req.url));
      } 
      
      // ⚠️ Verifique se 'token.role' está realmente chegando
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
        // Se estiver em manutenção, permite passar para renderizar o HTML de erro
        if (process.env.MAINTENANCE_MODE === "true") return true;

        // Se for rota de dashboard, exige token
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
  matcher: [
    "/dashboard/:path*",
    "/profile/settings/:path*",
    // Exclui arquivos estáticos e API
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};