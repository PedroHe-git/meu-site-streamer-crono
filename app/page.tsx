// app/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import LandingPage from "./components/LandingPage";
import HomeFeeds from "./components/HomeFeeds"; 
import UserSearch from "./components/UserSearch";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import { UserRole } from "@prisma/client";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // 1. Visitante (Sem Login) -> Vê a Landing Page
  if (!session) {
    return <LandingPage />;
  }

  // 2. Usuário Logado (Qualquer tipo) -> Vê o Feed
  // NÃO colocamos nenhum redirect aqui. O Criador vê o feed igual a todos.
  
  const firstName = session.user.name?.split(" ")[0] || session.user.username;
  const isCreator = session.user.role === UserRole.CREATOR;

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Cabeçalho Flutuante */}
      <div className="border-b bg-muted/20 sticky top-[57px] z-30 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  
                  <div className="flex items-center gap-2 self-start md:self-center">
                      <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 whitespace-nowrap">
                          <span>👋</span> Olá, {firstName}!
                      </h1>
                  </div>

                  <div className="w-full md:max-w-md">
                      <UserSearch />
                  </div>
              </div>
              
              {/* Botão Dashboard (Só aparece para Criadores, mas não força a ida) */}
              {isCreator && (
                <div className="md:hidden mt-4 flex justify-center">
                    <Link href="/dashboard" className="w-full">
                        <Button variant="outline" className="w-full gap-2">
                            <LayoutDashboard className="h-4 w-4" /> 
                            Ir para o Meu Painel
                        </Button>
                    </Link>
                </div>
              )}
          </div>
      </div>

      {/* O Conteúdo Principal é o Feed para todos */}
      <div className="container mx-auto px-4 py-8">
          <HomeFeeds />
      </div>
    </main>
  );
}