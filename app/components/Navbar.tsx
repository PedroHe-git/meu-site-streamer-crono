// app/components/Navbar.tsx

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
import { Users, Snowflake } from "lucide-react"; // <--- Importar Snowflake
import FollowedCreatorsList from "./FollowedCreatorsList"; 

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";


export default function Navbar() {
  const { data: session, status } = useSession();
  
  const userRole = session?.user?.role;
  const isCreator = userRole === "CREATOR";
  
  const fallbackLetter = (session?.user?.name || session?.user?.username || "U")
                         .charAt(0)
                         .toUpperCase();

  return (
    <nav className="bg-background border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* Logo Festivo */}
        <Link href="/" className="text-2xl font-bold text-foreground hover:text-primary flex items-center gap-2 group">
          <span className="relative">
            MeuCronograma
            {/* Gorro de Natal "Simulado" com ícone */}
            <Snowflake className="h-5 w-5 text-blue-400 absolute -top-3 -right-4 animate-pulse group-hover:rotate-180 transition-transform duration-700" />
          </span>
        </Link>
        
        <div className="flex items-center gap-3"> 
          
          {status === "loading" && (
            <div className="flex items-center gap-3">
              <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
              <div className="h-9 w-16 rounded-md bg-muted animate-pulse" />
            </div>
          )}

          {status === "unauthenticated" && (
            <>
              <Link href="/auth/register" className={buttonVariants({ variant: "ghost", className: "h-9 px-3 text-sm" })}>
                Registrar
              </Link>
              <Link href="/auth/signin" className={buttonVariants({ className: "h-9 px-4 text-sm bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white border-none" })}>
                 Entrar 🎅
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
                Sair
              </Button>
            </>
          )}

          <ThemeToggle />

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
                  <SheetTitle className="text-xl flex items-center gap-2">
                    Criadores que você segue <Snowflake className="h-4 w-4 text-blue-400"/>
                  </SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto p-6 pt-0">
                  <FollowedCreatorsList />
                </div>
              </SheetContent>
            </Sheet>
          )}

          {status === 'authenticated' && session?.user && (
            <Avatar className="h-9 w-9 border border-red-200 ring-2 ring-red-100 dark:ring-red-900">
              <AvatarImage 
                src={session.user.image ?? undefined} 
                alt={session.user.username} 
              />
              <AvatarFallback className="bg-red-50 text-red-600 font-bold">{fallbackLetter}</AvatarFallback>
            </Avatar>
          )}
          
        </div>
      </div>
    </nav>
  );
}