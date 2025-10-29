"use client"; // <-- Transforma em Componente Cliente

import { useState, useEffect } from "react"; // Importa hooks
import Link from "next/link";
import { Button } from "@/components/ui/button";
// --- [NOVO] Importa Input e Avatar ---
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Adicione com `npx shadcn-ui@latest add avatar`
// --- [FIM NOVO] ---
// Remove imports do lado do servidor (getServerSession, redirect)
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/lib/authOptions";
// import { redirect } from "next/navigation";
import { useSession } from "next-auth/react"; // Usa useSession no cliente


// --- [NOVO] Tipo para os resultados da pesquisa ---
type CreatorSearchResult = {
  username: string;
  name: string | null;
  image: string | null;
};
// --- [FIM NOVO] ---

export default function HomePage() {
   // Usa useSession para verificar se está logado (opcional na homepage)
   const { data: session, status } = useSession();

  // --- [NOVO] Estados para a pesquisa ---
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<CreatorSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  // --- [FIM NOVO] ---

  // --- [NOVO] Efeito para buscar criadores (com debounce) ---
  useEffect(() => {
    // Só pesquisa se o termo tiver pelo menos 2 caracteres
    if (searchTerm.length < 2) {
      setResults([]); // Limpa resultados se a pesquisa for curta
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
        setResults([]); // Limpa resultados em caso de erro
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce

    // Limpa o timeout se o utilizador continuar a digitar
    return () => clearTimeout(handler);

  }, [searchTerm]); // Executa quando searchTerm muda
  // --- [FIM NOVO] ---


  // O getServerSession e redirect foram removidos,
  // pois esta página agora é Cliente. A proteção de rotas
  // logadas deve ser feita no layout ou middleware.

  return (
    // Ajusta layout para incluir a pesquisa
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 pt-20"> {/* Aumenta padding top */}

      {/* Conteúdo Principal */}
      <div className="text-center max-w-3xl w-full"> {/* Aumenta max-width */}
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6">
            Bem-vindo ao MeuCronograma!
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10">
            Organize seus filmes, séries e animes. Crie listas, agende sessões ou explore os cronogramas de outros criadores!
          </p>

          {/* --- [NOVO] Barra de Pesquisa de Criadores --- */}
          <div className="mb-8 relative">
             <Input
               type="text"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Pesquisar criadores por nome ou username..."
               className="w-full p-4 text-lg border-2 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg shadow-sm" // Estilo maior
             />
             {isLoading && (
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {/* Pode adicionar um spinner aqui */}
                    A carregar...
                 </div>
             )}
          </div>
          {/* --- [FIM NOVO] --- */}

          {/* --- [NOVO] Resultados da Pesquisa --- */}
          {searchError && <p className="text-red-600 mb-4">{searchError}</p>}
          {/* Só mostra resultados se houver termo de pesquisa E não estiver a carregar */}
          {searchTerm.length >= 2 && !isLoading && (
            <div className="mb-10 text-left bg-white p-4 rounded-lg shadow-md max-h-60 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-slate-500 text-center">Nenhum criador encontrado.</p>
              ) : (
                <ul className="space-y-3">
                  {results.map((creator) => (
                    <li key={creator.username}>
                      <Link href={`/${creator.username}`} className="flex items-center gap-3 p-2 rounded hover:bg-slate-100 transition-colors">
                        <Avatar className="h-8 w-8">
                           <AvatarImage src={creator.image ?? undefined} alt={creator.name || creator.username} />
                           <AvatarFallback>{(creator.name || creator.username).substring(0, 1)}</AvatarFallback>
                        </Avatar>
                        <div>
                           <span className="font-medium text-slate-800">{creator.name || creator.username}</span>
                           {creator.name && <span className="text-sm text-slate-500 ml-1">(@{creator.username})</span>}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {/* --- [FIM NOVO] --- */}


          {/* Botões Entrar/Registar (Apenas se não logado) */}
          {/* Usamos 'status' do useSession */}
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
           {/* Link para o Dashboard (Apenas se logado) */}
           {status === 'authenticated' && (
               <div className="flex justify-center">
                   <Button asChild size="lg">
                       <Link href="/dashboard">Ir para o Dashboard</Link>
                   </Button>
               </div>
           )}
           {/* Mostra loading da sessão */}
           {status === 'loading' && (
              <p className="text-slate-500 mt-4">A verificar sessão...</p>
           )}

       </div>
    </div>
  );
}


