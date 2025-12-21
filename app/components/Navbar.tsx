"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react"; // Removi o signIn daqui
import { Menu, LayoutDashboard, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Início", href: "/" },
  { name: "Sobre", href: "/sobre" },
  { name: "Cronograma", href: "/cronograma" },
  { name: "VODS | Assistidos", href: "/historico" },
  { name: "Patrocinios", href: "/patrocinio" },
  { name: "Redes", href: "/redes" },
  { name: "Contato", href: "/contato" },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shouldShowBackground = isScrolled || pathname !== "/";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        shouldShowBackground
          ? "bg-gray-950/90 backdrop-blur-md border-gray-800 py-3 shadow-md"
          : "bg-transparent border-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        
        {/* LOGO */}
        <Link 
          href="/" 
          className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity text-white"
        >
          <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white shadow-lg">
            M
          </div>
          <span>MahMoojen</span>
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
                  isActive ? "text-white font-bold" : "text-gray-400 hover:text-white"
                )}
              >
                {item.name}
                <span className={cn(
                  "absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 transform scale-x-0 transition-transform duration-300",
                  isActive ? "scale-x-100" : "group-hover:scale-x-100"
                )}></span>
              </Link>
            );
          })}
        </nav>

        {/* ÁREA DIREITA (Só mostra se estiver LOGADO) */}
        <div className="hidden md:flex items-center gap-4">
          {status === 'loading' ? null : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-800 transition-colors">
                  <Avatar className="h-9 w-9 border-2 border-purple-600/50">
                    <AvatarImage src={session.user?.image || ""} />
                    <AvatarFallback className="bg-purple-900 text-white">
                      {session.user?.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-950 border-gray-800 text-white" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                    <p className="text-xs leading-none text-gray-400">{session.user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem asChild className="focus:bg-gray-800 focus:text-white cursor-pointer">
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Painel Admin
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()} className="text-red-400 focus:text-red-400 focus:bg-red-950/20 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             // SE NÃO TIVER LOGADO: Não mostra nada (vazio)
             <div className="w-8" /> 
          )}
        </div>

        {/* MENU MOBILE */}
        <div className="md:hidden text-white">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-gray-800 text-white">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-gray-950 border-gray-800 text-white">
              <div className="flex flex-col gap-6 mt-8">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "text-lg font-medium py-2 border-b border-gray-800",
                        pathname === item.href ? "text-purple-400" : "text-gray-400"
                      )}
                    >
                      {item.name}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}