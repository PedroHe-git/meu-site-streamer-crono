"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // <--- Importante para saber em qual pág está
import { useSession } from "next-auth/react";
import { Menu, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// AGORA OS LINKS SÃO ROTAS REAIS
const navItems = [
  { name: "Início", href: "/" },
  { name: "Cronograma", href: "/cronograma" },
  { name: "Histórico", href: "/historico" },
  { name: "Sobre", href: "/sobre" },
  { name: "Redes", href: "/redes" },
  { name: "Contato", href: "/contato" },
];

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname(); // Pega a rota atual (ex: /cronograma)
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
        // Adiciona fundo se rolar OU se não estiver na Home (para garantir leitura nas outras págs)
        isScrolled || pathname !== "/"
          ? "bg-background/95 backdrop-blur-md border-border py-2 shadow-sm"
          : "bg-transparent py-4"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            P
          </div>
          <span>PedroHE</span>
        </Link>

        {/* MENU DESKTOP */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors relative group py-2",
                  isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"
                )}
              >
                {item.name}
                {/* Linha embaixo do link ativo */}
                <span className={cn(
                  "absolute bottom-0 left-0 w-full h-0.5 bg-primary transform scale-x-0 transition-transform duration-300",
                  isActive ? "scale-x-100" : "group-hover:scale-x-100"
                )}></span>
              </Link>
            );
          })}
        </nav>

        {/* ÁREA DO DONO */}
        <div className="hidden md:flex items-center gap-4">
          {session && (
             <Button variant="secondary" size="sm" asChild className="font-bold">
              <Link href="/dashboard">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Painel Admin
              </Link>
            </Button>
          )}
        </div>

        {/* MENU MOBILE */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-6 mt-8">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "text-lg font-medium",
                        pathname === item.href ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {item.name}
                    </Link>
                  </SheetClose>
                ))}
                
                {session && (
                  <>
                    <div className="h-px bg-border my-2" />
                    <SheetClose asChild>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-lg font-medium text-primary"
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        Ir para Painel
                      </Link>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}