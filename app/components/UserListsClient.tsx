"use client";

import { useState, useMemo, useEffect } from "react";
// SessionProvider não é necessário aqui, pois a página é pública
// import { SessionProvider } from "next-auth/react";
import Image from "next/image";
import { Media, MediaStatus } from '@prisma/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 

// Tipagem
type MediaStatusWithMedia = MediaStatus & { media: Media; };
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";
type InitialListData = { items: MediaStatusWithMedia[]; totalCount: number; };
type PaginatedListData = InitialListData & { page: number; pageSize: number; };
type Props = { username: string; initialToWatch: InitialListData; initialWatching: InitialListData; initialWatched: InitialListData; initialDropped: InitialListData; };

const PAGE_SIZE = 20;

export default function UserListsClient({ username, initialToWatch, initialWatching, initialWatched, initialDropped }: Props) {

  // Estados
  const [listData, setListData] = useState<Record<StatusKey, PaginatedListData>>({ TO_WATCH: { ...initialToWatch, page: 1, pageSize: PAGE_SIZE }, WATCHING: { ...initialWatching, page: 1, pageSize: PAGE_SIZE }, WATCHED: { ...initialWatched, page: 1, pageSize: PAGE_SIZE }, DROPPED: { ...initialDropped, page: 1, pageSize: PAGE_SIZE }, });
  const [loadingStatus, setLoadingStatus] = useState<Record<StatusKey, boolean>>({ TO_WATCH: false, WATCHING: false, WATCHED: false, DROPPED: false });
  const [searchTerm, setSearchTerm] = useState("");

  // fetchPage (lógica interna permanece a mesma)
  const fetchPage = async (status: StatusKey, page: number, search: string) => { 
    setLoadingStatus(prev => ({ ...prev, [status]: true })); 
    try { 
      const params = new URLSearchParams({ status: status, page: page.toString(), pageSize: PAGE_SIZE.toString(), }); 
      if (search) { params.append('searchTerm', search); } 
      const res = await fetch(`/api/users/${username}/lists?${params.toString()}`); 
      if (!res.ok) { throw new Error(`Falha ao buscar página ${page} de ${status}`); } 
      const data: PaginatedListData = await res.json(); 
      setListData(prev => ({ ...prev, [status]: data })); 
    } catch (error) { 
      console.error(`Erro ao buscar página ${page} de ${status}:`, error); 
      const emptyData = { items: [], totalCount: listData[status]?.totalCount || 0, page: 1, pageSize: PAGE_SIZE }; 
      setListData(prev => ({ ...prev, [status]: emptyData })); 
    } finally { 
      setLoadingStatus(prev => ({ ...prev, [status]: false })); 
    } 
  };
  
  // useEffect Search (lógica interna permanece a mesma)
  useEffect(() => { 
    const handler = setTimeout(() => { 
      fetchPage("TO_WATCH", 1, searchTerm); 
      fetchPage("WATCHING", 1, searchTerm); 
      fetchPage("WATCHED", 1, searchTerm); 
      fetchPage("DROPPED", 1, searchTerm); 
    }, 500); 
    return () => clearTimeout(handler); 
    /* eslint-disable-next-line react-hooks/exhaustive-deps */ 
  }, [searchTerm, username]);

  // renderListSection (com todas as correções de cor)
  const renderListSection = (title: string, statusKey: StatusKey, opacityClass = "opacity-100") => {
    const data = listData[statusKey] || { items: [], totalCount: 0, page: 1, pageSize: PAGE_SIZE };
    const isLoading = loadingStatus[statusKey];
    const totalPages = Math.ceil(data.totalCount / data.pageSize);
    let listContent;

    if (isLoading) {
      // [CORREÇÃO] Usa text-muted-foreground
      listContent = <div className="text-center py-4 text-muted-foreground">A carregar...</div>;
    } else {
      const validItems = (data.items || []).filter(ms => ms && ms.media);
      if (validItems.length === 0) {
        // [CORREÇÃO] Usa text-muted-foreground
        listContent = (
          <p className="text-muted-foreground italic text-center py-6">
            {searchTerm ? "Nenhum item encontrado." : `Nenhum item na lista "${title}" ainda.`}
          </p>
        );
      } else {
        listContent = (
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 ${opacityClass}`}>
            {validItems.map((ms) => (
              // [CORREÇÃO] Troca 'bg-white' por 'bg-card border'
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
                  {/* [CORREÇÃO] Troca 'text-slate-800' por 'text-foreground' */}
                  <h3 className="text-sm font-semibold text-center text-foreground line-clamp-2">
                    {ms.media.title}
                  </h3>
                  {/* [CORREÇÃO] Troca 'text-indigo-600' por 'text-primary' */}
                  {title.includes('Assistido') && ms.lastSeasonWatched && (
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
        {/* [CORREÇÃO] Troca cores de borda e texto por cores semânticas */}
        <h2 className={`text-3xl font-semibold mb-6 border-b-2 ${title.includes('Assistido') || title.includes('Abandonados') ? 'border-border' : 'border-primary'} pb-3 text-foreground`}>
          {title} ({data.totalCount})
        </h2>
        {listContent}
        {!isLoading && totalPages > 1 && (
          // [CORREÇÃO] Troca 'border-slate-200' por 'border-border' e adiciona cor ao span
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
           // [CORREÇÃO] Remove classes de foco e adiciona placeholder semântico
           className="w-full p-3 text-base shadow-sm placeholder:text-muted-foreground"
         />
       </div>

      {/* Renderiza as secções */}
      {renderListSection("Assistindo", "WATCHING")}
      {renderListSection("Para Assistir", "TO_WATCH")}
      {renderListSection("Já Assistido", "WATCHED", "opacity-70")}
      {renderListSection("Abandonados", "DROPPED", "opacity-50")}
    </div>
  );
}