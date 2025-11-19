import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import LandingPage from "./components/LandingPage";
import Navbar from "./components/Navbar";
import HomeFeeds from "./components/HomeFeeds"; 
import UserSearch from "./components/UserSearch"; // <--- [NOVO] Importar
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // 1. Visitante
  if (!session) {
    return (
      <>
        
        <LandingPage />
      </>
    );
  }

  // 2. Usuário Logado
  const firstName = session.user.name?.split(" ")[0] || session.user.username;

  return (
    <>
      
      <main className="min-h-screen bg-background pb-20">
        
        {/* Cabeçalho com Pesquisa */}
        <div className="border-b bg-muted/20 sticky top-[57px] z-30 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    
                    {/* Saudação */}
                    <div className="flex items-center gap-2 self-start md:self-center">
                        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 whitespace-nowrap">
                            <span>👋</span> Olá, {firstName}!
                        </h1>
                    </div>

                    {/* Barra de Pesquisa Centralizada */}
                    <div className="w-full md:max-w-md">
                        <UserSearch />
                    </div>

                   
                </div>
                
                {/* Botão Dashboard Mobile (Aparece embaixo em telas pequenas) */}
                <div className="md:hidden mt-4 flex justify-center">
                    <Link href="/dashboard" className="w-full">
                        <Button variant="outline" className="w-full gap-2">
                            <LayoutDashboard className="h-4 w-4" /> 
                            Ir para o Meu Painel
                        </Button>
                    </Link>
                </div>

            </div>
        </div>

        {/* Feeds (Seguindo / Descobrir) */}
        <div className="container mx-auto px-4 py-8">
            <HomeFeeds />
        </div>
      </main>
    </>
  );
}