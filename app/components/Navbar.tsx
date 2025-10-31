"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
// 1. Importa 'buttonVariants' e o 'ThemeToggle'
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/app/components/theme-toggle";

export default function Navbar() {
  const { data: session, status } = useSession();
  
  // @ts-ignore
  const userRole = session?.user?.role;
  const isCreator = userRole === "CREATOR";

  return (
    // 2. CORREÇÃO DE ESTILO: Usa cores semânticas (bg-background, etc.)
    <nav className="bg-background border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* 3. CORREÇÃO DE ESTILO: Usa cores semânticas */}
        <Link href="/" className="text-2xl font-bold text-foreground hover:text-primary">
          MeuCronograma
        </Link>
        
        <div className="flex items-center gap-4">
          
          {/* 4. CORREÇÃO DE ESTILO: Usa cor semântica */}
          {status === "loading" && ( <span className="text-muted-foreground text-sm">A carregar...</span> )}
          
          {status === "unauthenticated" && (
            <>
              {/* 5. CORREÇÃO DE LINK: Usa 'buttonVariants' */}
              <Link 
                href="/auth/register" 
                className={buttonVariants({ variant: "ghost", className: "h-9 px-3 text-sm" })}
              >
                Criar Conta
              </Link>
              <Link 
                href="/auth/signin" 
                className={buttonVariants({ className: "h-9 px-4 text-sm" })}
              >
                Entrar
              </Link>
            </>
          )}
          
          {status === "authenticated" && session?.user && (
            <>
              {isCreator && (
                <>
                  {/* @ts-ignore */}
                  {session.user.username && (
                    <Link 
                      href={`/${session.user.username}`}
                      className={buttonVariants({ variant: "ghost", className: "h-9 px-3 text-sm" })}
                    >
                      Minha Página
                    </Link>
                  )}
                  <Link 
                    href="/dashboard" 
                    className={buttonVariants({ variant: "ghost", className: "h-9 px-3 text-sm" })}
                  >
                    Dashboard
                  </Link>
                </>
              )}
              
              {/* O Botão de Logout está CORRETO pois é um 'onClick', não um 'Link' */}
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="h-9 px-3 text-sm">
                Logout
              </Button>
            </>
          )}

          {/* 6. ADIÇÃO: Botão de trocar o tema */}
          <ThemeToggle />
          
        </div>
      </div>
    </nav>
  );
}