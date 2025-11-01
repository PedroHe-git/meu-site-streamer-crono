// app/page.tsx (Layout "Integrado" Limpo)

"use client"; 

import { useState, useEffect } from "react"; 
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
import { useSession } from "next-auth/react"; 
import Image from "next/image"; 

// --- [REMOVIDO] Não precisamos mais do FollowedCreatorsList aqui ---
// import FollowedCreatorsList from "@/app/components/FollowedCreatorsList";

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

  // Efeito para buscar criadores
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
    // Layout de 1 coluna
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pt-20">
      
      {/* --- Bloco 1: Conteúdo Principal (Hero, Pesquisa, Auth) --- */}
      <div className="text-center max-w-3xl w-full"> 
        
        {/* Conteúdo Principal (Hero) */}
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
          Bem-vindo ao MeuCronograma!
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10">
          Organize seus filmes, séries e animes. Crie listas, agende sessões ou explore os cronogramas de outros criadores!
        </p>

        {/* Barra de Pesquisa de Criadores */}
        <h3 className="text-2xl font-bold text-foreground mb-4">Explorar Criadores</h3>
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
        
        {/* Resultados da Pesquisa */}
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
        
        {/* Botões de Autenticação */}
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
          {status === 'authenticated' && (
              <div className="flex justify-center">
                  <Button asChild size="lg">
                      <Link href="/dashboard">Ir para o Dashboard</Link>
                  </Button>
              </div>
          )}
          {status === 'loading' && (
            <p className="text-muted-foreground mt-4">A verificar sessão...</p>
          )}

      </div> {/* --- Fim do Bloco 1 --- */}
      
      {/* --- Bloco 2: Secção "Como Funciona" (Integrada) --- */}
      <section className="w-full max-w-5xl my-16 lg:my-24">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Como Funciona
        </h2>

        {/* Feature 1: Listas */}
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 mb-12">
            <div className="rounded-lg overflow-hidden border shadow-lg">
              <Image 
                src="/images/buscar.png" // Confirme que este ficheiro está em /public/images/
                alt="Painel de Listas do MeuCronograma"
                width={1200}
                height={700}
                className="object-cover"
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-primary">Busque seus filmes, séries e animes</h3>
              <p className="text-muted-foreground text-sm">
                 Busque por filmes, séries, animes ou adicione outro item manualmente. Marque o que quer assistir, o que está assistindo, e o que já terminou.
              </p>
            </div>
          </div>

            {/* Feature 1: Listas */}
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 mb-12">
            <div className="rounded-lg overflow-hidden border shadow-lg">
              <Image 
                src="/images/listas.png" // Confirme que este ficheiro está em /public/images/
                alt="Painel de Listas do MeuCronograma"
                width={1200}
                height={700}
                className="object-cover"
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-primary">Organize as suas Listas</h3>
              <p className="text-muted-foreground text-sm">
                 Utilize as listas Para Assistir, Assistindo, Já Assistou e Abandonados, para ter mais controle sobre seus Itens
              </p>
            </div>
          </div>

          {/* Feature 1: Listas */}
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 mb-12">
            <div className="rounded-lg overflow-hidden border shadow-lg">
              <Image 
                src="/images/geriragenda.png" // Confirme que este ficheiro está em /public/images/
                alt="Painel de Listas do MeuCronograma"
                width={1200}
                height={700}
                className="object-cover"
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-primary">Monte seu Cronograma</h3>
              <p className="text-muted-foreground text-sm">
                 Use o Gerir Agendamento para criar o seu cronograma com os títulos que estão na sua lista Assistindo.<br />Selecione o Titulo, escolha uma data e horário (opcional) e finalize em Agendar Item. Pronto, fácil assim o seu Item está agendado.
              
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
            <div className="space-y-3 md:order-last">
              <h3 className="text-xl font-semibold text-primary">Terminou de assistir?</h3>
              <p className="text-muted-foreground text-sm">
                Clique em Concluído/Visto nos itens que acabou de ver ou Remover caso não consiga assistir.<br />O seu cronograma concluído fica guardado no seu perfil público como um histórico.
            
              </p>
            </div>
            <div className="rounded-lg overflow-hidden border shadow-lg md:order-first">
              <Image 
                src="/images/concluaitens.png" // Confirme que este ficheiro está em /public/images/
                alt="Agendador do MeuCronograma"
                width={1200}
                height={700}
                className="object-cover"
              />
            </div>
          </div>
      </section>
      {/* --- Fim do Bloco 2 --- */}
      
    </div>
  );
}