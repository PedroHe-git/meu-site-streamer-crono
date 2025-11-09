// app/page.tsx (Agora com verificação de Role)

"use client"; 

import { useState, useEffect } from "react"; 
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
import { useSession } from "next-auth/react"; 
import { useRouter } from "next/navigation"; 

// --- [NOVO] 1. Importar o UserRole ---
import { UserRole } from "@prisma/client";

import LandingPage from "@/app/components/LandingPage";

type CreatorSearchResult = {
  username: string;
  name: string | null;
  image: string | null;
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter(); 

  // --- [NOVO] 2. Verificar se é Criador ---
  const userRole = session?.user?.role as UserRole | undefined;
  const isCreator = userRole === UserRole.CREATOR;
  // --- [FIM DA MUDANÇA] ---

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<CreatorSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    if (status !== 'authenticated' || searchTerm.length < 2) {
      setResults([]); 
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setSearchError("");

    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
        if (!res.ok) {
          throw new Error("Falha ao buscar criadores");
        }
        const data = await res.json();
        setResults(data);
      } catch (err: any) {
        setSearchError(err.message || "Erro ao pesquisar.");
        setResults([]); 
      } finally {
        setIsLoading(false);
      }
    }, 500); 

    return () => clearTimeout(handler);

  }, [searchTerm, status]); 

  // --- Lógica de Renderização ---

  // 1. Estado de Carregamento
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">A carregar...</p>
      </div>
    );
  }

  // 2. Estado Não Autenticado
  if (status === 'unauthenticated') {
    const handleGetStarted = () => {
      router.push('/auth/register');
    };
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // 3. Estado Autenticado
  if (status === 'authenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 pt-20">
        <div className="text-center max-w-3xl w-full"> 
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Olá, {session.user.name || session.user.username}!
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            {/* [NOVO] 3. Mensagem diferente para Criador vs Visitante */}
            {isCreator 
              ? "Explore criadores ou vá para o seu painel."
              : "Explore e siga os seus criadores favoritos."
            }
          </p>

          <div className="mb-8 relative">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar criadores por nome ou username..."
                className="w-full p-4 text-lg rounded-lg shadow-sm placeholder:text-muted-foreground"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  A carregar...
                </div>
              )}
          </div>
          
          {searchError && <p className="text-red-600 mb-4">{searchError}</p>} 
          {searchTerm.length >= 2 && !isLoading && (
            <div className="mb-10 text-left bg-card p-4 rounded-lg shadow-md max-h-60 overflow-y-auto border">
                {results.length === 0 ? (
                  <p className="text-muted-foreground text-center">Nenhum criador encontrado.</p>
                ) : (
                  <ul className="space-y-3">
                    {results.map((creator) => (
                      <li key={creator.username}>
                        <Link href={`/${creator.username}`} className="flex items-center gap-3 p-2 rounded hover:bg-accent transition-colors">
                          <Avatar className="h-8 w-8">
                              <AvatarImage src={creator.image ?? undefined} alt={creator.name || creator.username} />
                              <AvatarFallback>{(creator.name || creator.username).substring(0, 1)}</AvatarFallback>
                          </Avatar>
                          <div>
                              <span className="font-medium text-foreground">{creator.name || creator.username}</span>
                              {creator.name && <span className="text-sm text-muted-foreground ml-1">(@{creator.username})</span>}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          
          {/* --- [NOVO] 4. Condicional para o Botão --- */}
          <div className="flex justify-center">
              {/* Só mostra o botão do Dashboard se for Criador */}
              {isCreator && (
                  <Button asChild size="lg">
                      <Link href="/dashboard">Ir para o Dashboard</Link>
                  </Button>
              )}
          </div>
          {/* --- [FIM DA CORREÇÃO] --- */}

        </div>
      </div>
    );
  }

  return null;
}