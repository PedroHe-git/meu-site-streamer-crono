"use client";

import { useState, useEffect, useCallback } from "react";
import { Media, MediaStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Film } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

// --- [CONFIGURAÇÃO] ---
// Defina quantos itens por página você quer mostrar
const PAGE_SIZE = 5;
// --- [FIM DA CONFIGURAÇÃO] ---

// Tipos
type MediaStatusWithMedia = MediaStatus & { media: Media };

type PaginatedListProps = {
  username: string;
  status: "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";
  searchTerm: string; 
};

export default function PaginatedList({ username, status, searchTerm }: PaginatedListProps) {
  const [items, setItems] = useState<MediaStatusWithMedia[]>([]);
  
  // --- [INÍCIO DAS MUDANÇAS] ---
  // Reintroduzimos o estado da página e da contagem total
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  // --- [FIM DAS MUDANÇAS] ---

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usamos 'useCallback' para memorizar a função de busca
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status: status,
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(), // Usa o nosso limite
        searchTerm: searchTerm, 
      });

      const res = await fetch(
        `/api/users/${username}/lists?${params.toString()}`
      );
      if (!res.ok) {
        throw new Error("Falha ao carregar a lista.");
      }
      const data = await res.json();
      setItems(data.items);
      setTotalCount(data.totalCount); // Armazena a contagem total
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [username, status, page, searchTerm]); // Depende da página e da busca

  // useEffect que busca os dados
  useEffect(() => {
    // Adiciona um debounce para a pesquisa
    const delayDebounce = setTimeout(() => {
      fetchItems();
    }, 300); 

    return () => clearTimeout(delayDebounce); 
  }, [fetchItems]); // Dispara sempre que o fetchItems (e as suas dependências) mudar

  // --- [NOVO] ---
  // useEffect que RESETA a página para 1 quando o 'searchTerm' muda
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);
  // --- [FIM NOVO] ---

  // Lógica de Paginação
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handlePreviousPage = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setPage((p) => Math.min(totalPages, p + 1));
  };
  // --- [FIM DA LÓGICA DE PAGINAÇÃO] ---


  const getTypeBadge = (type: string) => {
    switch (type) {
      case "MOVIE": return "Filme";
      case "SERIES": return "Série";
      case "ANIME": return "Anime";
      default: return "Outro";
    }
  };

  if (isLoading && items.length === 0) { // Mostra o spinner grande só na carga inicial
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        <Film className="h-12 w-12 mx-auto mb-4 opacity-30" />
        {searchTerm ? (
          <p>Nenhum item encontrado para "{searchTerm}".</p>
        ) : (
          <p>Nenhum item encontrado nesta lista.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lista de Itens (com indicador de loading) */}
      <div className={`space-y-3 ${isLoading ? 'opacity-50' : ''}`}>
        {items.map((item) => (
          <Card key={item.id} className="flex gap-4 p-4 shadow-sm">
            <ImageWithFallback
              src={item.media.posterPath} 
              alt={item.media.title}
              width={80}
              height={120}
              className="rounded-md object-cover"
            />
            <div className="flex-1">
              <h3 className="text-lg font-bold">{item.media.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{getTypeBadge(item.media.mediaType)}</Badge>
                {item.media.releaseYear && (
                  <Badge variant="secondary">{item.media.releaseYear}</Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* --- [MUDANÇA] --- */}
      {/* Adicionamos os botões de Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={handlePreviousPage}
            disabled={page === 1 || isLoading}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={page === totalPages || isLoading}
          >
            Próxima
          </Button>
        </div>
      )}
      {/* --- [FIM DA MUDANÇA] --- */}
    </div>
  );
}