"use client";

import Link from "next/link";
// --- Usa imports v4 ---
import { useSession, signIn, signOut } from "next-auth/react";
// --- FIM ---
import Image from "next/image";
import { Button } from "@/components/ui/button"; // Importa Button para consistência

export default function Navbar() {
  const { data: session, status } = useSession();

  // --- [NOVO] Verifica a role do utilizador ---
  // A role vem da sessão (adicionada pelos callbacks do NextAuth)
  // @ts-ignore (Ignora erro de tipo temporário até definirmos melhor o tipo Session)
  const userRole = session?.user?.role;
  const isCreator = userRole === "CREATOR";
  // --- [FIM NOVO] ---

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">

        <Link href="/" className="text-2xl font-bold text-slate-900 hover:text-indigo-600">
          MeuCronograma
        </Link>

        <div className="flex items-center gap-4">

          {status === "loading" && (
            <span className="text-gray-500 text-sm">A carregar...</span>
          )}

          {status === "unauthenticated" && (
            <>
              <Button variant="ghost" asChild className="h-9 px-3 text-sm">
                 <Link href="/auth/register">Registar</Link>
              </Button>
              <Button asChild className="h-9 px-4 text-sm">
                 <Link href="/auth/signin">Login</Link>
              </Button>
            </>
          )}

          {status === "authenticated" && session?.user && (
            <>
              {/* --- [MUDANÇA AQUI] Renderização Condicional --- */}
              {/* Só mostra links Dashboard/Minha Página se for CREATOR */}
              {isCreator && (
                <>
                  {/* Link para a Página Pública */}
                  {/* @ts-ignore */}
                  {session.user.username && (
                     <Button variant="ghost" asChild className="h-9 px-3 text-sm">
                         <Link href={`/${session.user.username}`}>Minha Página</Link>
                     </Button>
                  )}
                  {/* Link para o Dashboard */}
                   <Button variant="ghost" asChild className="h-9 px-3 text-sm">
                       <Link href="/dashboard">Dashboard</Link>
                   </Button>
                </>
              )}
              {/* --- [FIM MUDANÇA] --- */}

              {/* Avatar (sempre visível se logado) */}
              {session.user.image && (
                 <Image src={session.user.image} alt={session.user.name || "Avatar"} width={32} height={32} className="rounded-full" />
              )}

              {/* Botão de Logout (sempre visível se logado) */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="h-9 px-3 text-sm"
              >
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

