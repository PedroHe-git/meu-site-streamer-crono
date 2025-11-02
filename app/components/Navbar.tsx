"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/app/components/theme-toggle";

import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Users } from "lucide-react"; 
import FollowedCreatorsList from "./FollowedCreatorsList"; 

// --- [MUDANÇA 1: Importar o Avatar] ---
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export default function Navbar() {
  const { data: session, status } = useSession();
  
  const userRole = session?.user?.role;
  const isCreator = userRole === "CREATOR";
  
  // --- [MUDANÇA 2: Definir o Fallback do Avatar] ---
  // Obter a primeira letra do nome ou username, ou "U"
  const fallbackLetter = (session?.user?.name || session?.user?.username || "U")
                         .charAt(0)
                         .toUpperCase();

  return (
    <nav className="bg-background border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        
        <Link href="/" className="text-2xl font-bold text-foreground hover:text-primary">
          MeuCronograma
        </Link>
        
        <div className="flex items-center gap-3"> {/* Aumentado o gap para 3 */}
          
          {status === "loading" && ( <span className="text-muted-foreground text-sm">A carregar...</span> )}
          
          {status === "unauthenticated" && (
            <>
              <Link href="/auth/register" className={buttonVariants({ variant: "ghost", className: "h-9 px-3 text-sm" })}>
                Registrar
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

          {/* Menu "Seguindo" */}
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
                <div className="overflow-y-auto p-6 pt-0">
                  <FollowedCreatorsList />
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* --- [MUDANÇA 3: Mostrar o Avatar do Utilizador] --- */}
          {/* Só mostra se o utilizador estiver logado */}
          {status === 'authenticated' && session?.user && (
            <Avatar className="h-9 w-9 border">
              <AvatarImage 
                src={session.user.image ?? undefined} 
                alt={session.user.username} 
              />
              <AvatarFallback>{fallbackLetter}</AvatarFallback>
            </Avatar>
          )}
          {/* --- [FIM DA MUDANÇA] --- */}
          
        </div>
      </div>
    </nav>
  );
}

