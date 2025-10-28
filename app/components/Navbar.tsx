"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image"; // Importa o Image

export default function Navbar() {
  const { data: session, status } = useSession();
  
  // @ts-ignore
  const username = session?.user?.username; // Agora isto vai funcionar!

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-7xl">

        {/* Logo / Título do Site */}
        <Link href="/" className="text-2xl font-bold text-slate-900 hover:text-indigo-600">
          MeuCronograma
        </Link>

        {/* Links de Navegação */}
        <div className="flex items-center gap-4">

          {status === "loading" && (
            <span className="text-gray-500 text-sm">A carregar...</span>
          )}

          {/* --- [MUDANÇA AQUI] --- */}
          {/* Se o utilizador NÃO estiver logado */}
          {status === "unauthenticated" && (
            <>
              {/* Aponta para a página de registo personalizada */}
              <Link href="/auth/register" className="text-slate-600 hover:text-slate-900 text-sm font-medium">
                Registar
              </Link>
              {/* Aponta para a página de login personalizada */}
              <Link
                href="/auth/signin"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Login
              </Link>
            </>
          )}
          {/* --- [FIM DA MUDANÇA] --- */}

          {/* Se o utilizador ESTIVER logado */}
          {status === "authenticated" && session.user && (
            <>
              <Link
                href={`/${username}`} // O username agora existe na sessão
                className="text-slate-600 hover:text-slate-900 text-sm"
              >
                Minha Página
              </Link>

              <Link
                href="/dashboard"
                className="text-slate-600 hover:text-slate-900 text-sm"
              >
                Dashboard
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="bg-slate-200 text-slate-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-300"
              >
                Logout
              </button>
              
              {/* --- [NOVO] Adiciona o Avatar --- */}
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "Avatar"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              {/* --- [FIM NOVO] --- */}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
