"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
// --- [REMOVIDO] Import de Image ---
// import Image from "next/image";
// --- [FIM REMOÇÃO] ---

export default function Navbar() {
  const { data: session, status } = useSession();
  
  // @ts-ignore
  const userRole = session?.user?.role;
  const isCreator = userRole === "CREATOR";

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-slate-900 hover:text-indigo-600">
          MeuCronograma
        </Link>
        <div className="flex items-center gap-4">
          {status === "loading" && ( <span className="text-gray-500 text-sm">A carregar...</span> )}
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
              {isCreator && (
                <>
                  {/* @ts-ignore */}
                  {session.user.username && (
                     <Button variant="ghost" asChild className="h-9 px-3 text-sm">
                         <Link href={`/${session.user.username}`}>Minha Página</Link>
                     </Button>
                  )}
                   <Button variant="ghost" asChild className="h-9 px-3 text-sm">
                       <Link href="/dashboard">Dashboard</Link>
                   </Button>
                </>
              )}
              {/* --- [REMOVIDO] Avatar --- */}
              {/* {session.user.image && (
                 <Image src={session.user.image} alt={session.user.name || "Avatar"} width={32} height={32} className="rounded-full" />
              )} */}
              {/* --- [FIM REMOÇÃO] --- */}
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="h-9 px-3 text-sm">
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}


