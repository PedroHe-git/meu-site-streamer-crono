// app/components/UserListsClient.tsx (Atualizado)

"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Media, MediaStatus } from '@prisma/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 

// Tipagem
type MediaStatusWithMedia = MediaStatus & { media: Media; };
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";
type InitialListData = { items: MediaStatusWithMedia[]; totalCount: number; };
type PaginatedListData = InitialListData & { page: number; pageSize: number; };

// --- [MUDANÇA 1: Atualizar Props] ---
type Props = { 
  username: string; 
  initialToWatch: InitialListData; 
  initialWatching: InitialListData; 
  initialWatched: InitialListData; 
  initialDropped: InitialListData;
  // Adiciona as novas flags de visibilidade
  showToWatch: boolean;
  showWatching: boolean;
  showWatched: boolean;
  showDropped: boolean;
};
// --- [FIM DA MUDANÇA 1] ---

const PAGE_SIZE = 20;

export default function UserListsClient({ 
  username, 
  initialToWatch, initialWatching, initialWatched, initialDropped,
  // --- [MUDANÇA 2: Receber as novas props] ---
  showToWatch, showWatching, showWatched, showDropped
  // --- [FIM DA MUDANÇA 2] ---
}: Props) {

  // ... (Estados - sem mudanças)
  const [listData, setListData] = useState<Record<StatusKey, PaginatedListData>>({ TO_WATCH: { ...initialToWatch, page: 1, pageSize: PAGE_SIZE }, WATCHING: { ...initialWatching, page: 1, pageSize: PAGE_SIZE }, WATCHED: { ...initialWatched, page: 1, pageSize: PAGE_SIZE }, DROPPED: { ...initialDropped, page: 1, pageSize: PAGE_SIZE }, });
  const [loadingStatus, setLoadingStatus] = useState<Record<StatusKey, boolean>>({ TO_WATCH: false, WATCHING: false, WATCHED: false, DROPPED: false });
  const [searchTerm, setSearchTerm] = useState("");

  // fetchPage (lógica interna permanece a mesma)
  const fetchPage = async (status: StatusKey, page: number, search: string) => { 
    setLoadingStatus(prev => ({ ...prev, [status]: true })); 
    try { 
      // [MUDANÇA 3: Adicionar 'cache-buster' ao fetch para garantir dados novos]
      const cacheBuster = `&cb=${new Date().getTime()}`;
      const params = new URLSearchParams({ 
        username: username, // A API do Canvas espera 'username' como search param
        status: status, 
        page: page.toString(), 
        pageSize: PAGE_SIZE.toString(), 
      }); 
      if (search) { params.append('searchTerm', search); } 
      
      const res = await fetch(`/api/users/[username]/lists?${params.toString()}${cacheBuster}`, {
        cache: 'no-store' // Força o navegador a não usar cache
      }); 
      // [FIM DA MUDANÇA 3]

      if (!res.ok) { throw new Error(`Falha ao buscar página ${page} de ${status}`); } 
      const data: PaginatedListData = await res.json(); 
      setListData(prev => ({ ...prev, [status]: data })); 
    } catch (error) { 
      console.error(`Erro ao buscar página ${page} de ${status}:`, error); 
      // Não redefina os dados em caso de erro, mantenha os dados iniciais (vazios)
    } finally { 
      setLoadingStatus(prev => ({ ...prev, [status]: false })); 
    } 
  };
  
  // useEffect Search (lógica interna permanece a mesma)
  useEffect(() => { 
    const handler = setTimeout(() => { 
      // Só busca se a flag de visibilidade for verdadeira
      if (showToWatch) fetchPage("TO_WATCH", 1, searchTerm); 
      if (showWatching) fetchPage("WATCHING", 1, searchTerm); 
      if (showWatched) fetchPage("WATCHED", 1, searchTerm); 
      if (showDropped) fetchPage("DROPPED", 1, searchTerm); 
    }, 500); 
    return () => clearTimeout(handler); 
    /* eslint-disable-next-line react-hooks/exhaustive-deps */ 
  }, [searchTerm, username, showToWatch, showWatching, showWatched, showDropped]); // Adiciona as flags às dependências

  // renderListSection (sem mudanças)
  const renderListSection = (title: string, statusKey: StatusKey, opacityClass = "opacity-100") => {
    const data = listData[statusKey] || { items: [], totalCount: 0, page: 1, pageSize: PAGE_SIZE };
    const isLoading = loadingStatus[statusKey];
    const totalPages = Math.ceil(data.totalCount / data.pageSize);
    let listContent;

    if (isLoading) {
      listContent = <div className="text-center py-4 text-muted-foreground">A carregar...</div>;
    } else {
      const validItems = (data.items || []).filter(ms => ms && ms.media);
      if (validItems.length === 0) {
        listContent = (
          <p className="text-muted-foreground italic text-center py-6">
            {searchTerm ? "Nenhum item encontrado." : `Nenhum item na lista "${title}" ainda.`}
          </p>
        );
      } else {
        listContent = (
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 ${opacityClass}`}>
            {validItems.map((ms) => (
              <div key={ms.id} className="bg-card border rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                <Image
                  src={ ms.media.posterPath || "/poster-placeholder.png" }
                  width={500} height={750} alt={ms.media.title}
                  className="w-full h-auto"
                  style={{ width: 'auto' }}
                  unoptimized={true}
                  priority={data.page === 1 && validItems.indexOf(ms) < 5}
                />
                <div className="p-3 h-20 flex flex-col justify-center">
                  <h3 className="text-sm font-semibold text-center text-foreground line-clamp-2">
                    {ms.media.title}
                  </h3>
                  {ms.lastSeasonWatched !== null && (
                    <p className="text-xs text-center text-primary font-medium">
                      Visto até T{ms.lastSeasonWatched} E{ms.lastEpisodeWatched}{ms.lastEpisodeWatchedEnd && ms.lastEpisodeWatchedEnd > ms.lastEpisodeWatched! ? `-${ms.lastEpisodeWatchedEnd}` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      }
    }
    return (
      <div className="mb-14">
        <h2 className={`text-3xl font-semibold mb-6 border-b-2 ${title.includes('Assistido') || title.includes('Abandonados') ? 'border-border' : 'border-primary'} pb-3 text-foreground`}>
          {title} ({data.totalCount})
        </h2>
        {listContent}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-border text-sm">
            <Button onClick={() => fetchPage(statusKey, data.page - 1, searchTerm)} disabled={data.page <= 1 || isLoading} variant="outline" size="sm">
              Anterior
            </Button>
            <span className="text-muted-foreground"> Página {data.page} de {totalPages} </span>
            <Button onClick={() => fetchPage(statusKey, data.page + 1, searchTerm)} disabled={data.page >= totalPages || isLoading} variant="outline" size="sm">
              Próxima
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Barra de Pesquisa */}
       <div className="mb-8">
         <Input
           type="text"
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           placeholder="Pesquisar em todas as listas..."
           className="w-full p-3 text-base shadow-sm placeholder:text-muted-foreground"
         />
       </div>

      {/* --- [MUDANÇA 4: Renderização Condicional] --- */}
      {/* Renderiza as secções apenas se a flag for true */}
      {showWatching && renderListSection("Essa Semana", "WATCHING")}
      {showToWatch && renderListSection("Próximo Conteúdo", "TO_WATCH")}
      {showWatched && renderListSection("Já Assistido", "WATCHED", "opacity-70")}
      {showDropped && renderListSection("Abandonados", "DROPPED", "opacity-50")}

      {/* Mensagem se todas estiverem ocultas */}
      {!showWatching && !showToWatch && !showWatched && !showDropped && (
        <p className="text-muted-foreground italic text-center py-10">
          O criador escondeu todas as suas listas.
        </p>
      )}
      {/* --- [FIM DA MUDANÇA 4] --- */}
    </div>
  );
}
