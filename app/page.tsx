"use client"; 

import { useState, useEffect } from "react"; 
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
import { useSession } from "next-auth/react"; 

// Tipo para os resultados da pesquisa
type CreatorSearchResult = {
  username: string;
  name: string | null;
  image: string | null;
};

export default function HomePage() {
  const { data: session, status } = useSession();

  // Estados para a pesquisa
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<CreatorSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Efeito para buscar criadores (com debounce)
  useEffect(() => {
    if (searchTerm.length < 2) {
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

  }, [searchTerm]); 

  return (
    // [CORREÇÃO] Remove fundo gradiente, deixa o 'bg-background' do layout agir
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pt-20"> 

      {/* Conteúdo Principal */}
      <div className="text-center max-w-3xl w-full"> 
        {/* [CORREÇÃO] Usa cores semânticas para texto */}
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
          Bem-vindo ao MeuCronograma!
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10">
          Organize seus filmes, séries e animes. Crie listas, agende sessões ou explore os cronogramas de outros criadores!
        </p>

        {/* Barra de Pesquisa de Criadores (Corrigido) */}
        <div className="mb-8 relative">
            {/* [CORREÇÃO] Remove classes de borda/foco, usa padrão do Input Shadcn. Adiciona cor ao placeholder */}
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar criadores por nome ou username..."
              className="w-full p-4 text-lg rounded-lg shadow-sm placeholder:text-muted-foreground" // Estilo maior mantido, cores removidas
            />
            {isLoading && (
              // [CORREÇÃO] Usa cor semântica
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                A carregar...
              </div>
            )}
        </div>
        
        {/* Resultados da Pesquisa (Corrigido) */}
        {searchError && <p className="text-red-600 mb-4">{searchError}</p>} 
        {searchTerm.length >= 2 && !isLoading && (
          // [CORREÇÃO] Troca 'bg-white' por 'bg-card'
          <div className="mb-10 text-left bg-card p-4 rounded-lg shadow-md max-h-60 overflow-y-auto border"> {/* Adiciona 'border' */}
            {results.length === 0 ? (
              // [CORREÇÃO] Usa cor semântica
              <p className="text-muted-foreground text-center">Nenhum criador encontrado.</p>
            ) : (
              <ul className="space-y-3">
                {results.map((creator) => (
                  <li key={creator.username}>
                    {/* [CORREÇÃO] Troca 'hover:bg-slate-100' por 'hover:bg-accent' */}
                    <Link href={`/${creator.username}`} className="flex items-center gap-3 p-2 rounded hover:bg-accent transition-colors">
                      <Avatar className="h-8 w-8">
                          <AvatarImage src={creator.image ?? undefined} alt={creator.name || creator.username} />
                          <AvatarFallback>{(creator.name || creator.username).substring(0, 1)}</AvatarFallback>
                      </Avatar>
                      <div>
                          {/* [CORREÇÃO] Usa cores semânticas */}
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
        
        {/* Botões Entrar/Registar (Shadcn já é compatível) */}
        {status === 'unauthenticated' && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/auth/signin">Entrar</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/register">Criar Conta</Link>
              </Button>
            </div>
          )}
          {/* Link para o Dashboard (Shadcn já é compatível) */}
          {status === 'authenticated' && (
              <div className="flex justify-center">
                  <Button asChild size="lg">
                      <Link href="/dashboard">Ir para o Dashboard</Link>
                  </Button>
              </div>
          )}
          {/* Mostra loading da sessão (Corrigido) */}
          {status === 'loading' && (
            // [CORREÇÃO] Usa cor semântica
            <p className="text-muted-foreground mt-4">A verificar sessão...</p>
          )}

      </div>
    </div>
  );
}