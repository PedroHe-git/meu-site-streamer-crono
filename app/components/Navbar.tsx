// app/components/Navbar.tsx (Atualizado com "Sheet")

"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/app/components/theme-toggle";

// --- [NOVOS IMPORTS] ---
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Users } from "lucide-react"; // Ícone de Seguidores
import FollowedCreatorsList from "./FollowedCreatorsList"; // O componente que já criámos
// --- [FIM NOVOS IMPORTS] ---


export default function Navbar() {
  const { data: session, status } = useSession();
  
  // @ts-ignore
  const userRole = session?.user?.role;
  const isCreator = userRole === "CREATOR";

  return (
    <nav className="bg-background border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        
        <Link href="/" className="text-2xl font-bold text-foreground hover:text-primary">
          MeuCronograma
        </Link>
        
        <div className="flex items-center gap-2"> {/* (Gap reduzido ligeiramente) */}
          
          {status === "loading" && ( <span className="text-muted-foreground text-sm">A carregar...</span> )}
          
          {status === "unauthenticated" && (
            <>
              {/* ... (Botões Registar e Login) ... */}
              <Link href="/auth/register" className={buttonVariants({ variant: "ghost", className: "h-9 px-3 text-sm" })}>
                Registar
              </Link>
              <Link href="/auth/signin" className={buttonVariants({ className: "h-9 px-4 text-sm" })}>
                Login
              </Link>
            </>
          )}
          
          {status === "authenticated" && session?.user && (
            <>
              {isCreator && (
                <>
                  {/* @ts-ignore */}
                  {session.user.username && (
                    <Link href={`/${session.user.username}`} className={buttonVariants({ variant: "ghost", className: "h-9 px-3 text-sm" })}>
                      Minha Página
                    </Link>
                  )}
                  <Link href="/dashboard" className={buttonVariants({ variant: "ghost", className: "h-9 px-3 text-sm" })}>
                    Dashboard
                  </Link>
                </>
              )}
              
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="h-9 px-3 text-sm">
                Logout
              </Button>
            </>
          )}

          {/* Botão do Tema */}
          <ThemeToggle />

          {/* --- [NOVO MENU "SEGUINDO"] --- */}
          {/* Só mostra se o utilizador estiver logado */}
          {status === 'authenticated' && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Users className="h-4 w-4" />
                  <span className="sr-only">Criadores Seguidos</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="p-6 pb-4">
                  <SheetTitle className="text-xl">Criadores que você segue</SheetTitle>
                </SheetHeader>
                {/* O conteúdo do painel é a sua lista (que busca os dados) */}
                <div className="overflow-y-auto p-6 pt-0">
                  <FollowedCreatorsList />
                </div>
              </SheetContent>
            </Sheet>
          )}
          {/* --- [FIM DO NOVO MENU] --- */}
          
        </div>
      </div>
    </nav>
  );
}