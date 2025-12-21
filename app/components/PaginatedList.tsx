"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Edit, Search, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PaginatedListProps {
  username: string;
  status: "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";
  isOwner: boolean;
  isCompact?: boolean;
  itemsPerPage?: number; // <--- NOVA PROP
}

export default function PaginatedList({ 
  username, 
  status, 
  isOwner, 
  isCompact = false,
  itemsPerPage = 12 // Valor padrão se não for informado
}: PaginatedListProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        // Usa o itemsPerPage que veio da prop
        const res = await fetch(
          `/api/users/${username}/lists?status=${status}&page=${page}&limit=${itemsPerPage}&search=${encodeURIComponent(debouncedSearch)}`
        );
        
        if (!res.ok) throw new Error("Erro ao buscar lista");
        
        const data = await res.json();
        setItems(data.items);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [username, status, page, isCompact, debouncedSearch, itemsPerPage]); // Adicionado itemsPerPage na dependência

  // ... (função handleDelete igual)

  return (
    <div className="space-y-6">
      
      {/* BARRA DE PESQUISA */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input 
          placeholder="Pesquisar..." 
          className="pl-10 bg-gray-950/50 border-gray-800 text-white placeholder:text-gray-600 focus:border-purple-500 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-800 rounded-xl bg-gray-900/20 text-sm">
          {search ? "Nada encontrado." : "Lista vazia."}
        </div>
      )}

      {/* GRID DE ITENS */}
      {!loading && items.length > 0 && (
        <div className={cn(
          "grid gap-3",
          // Ajuste de colunas para o layout dividido (meia tela)
          isCompact 
            ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5" 
            : "grid-cols-1 sm:grid-cols-2"
        )}>
          {items.map((item) => (
            <Card 
              key={item.id} 
              className={cn(
                "overflow-hidden group relative border-gray-800 bg-gray-900 hover:border-gray-600 transition-all flex flex-col",
                isCompact ? "border-0 bg-transparent shadow-none" : ""
              )}
            >
              <div className={cn(
                "relative w-full overflow-hidden rounded-lg bg-gray-800 shadow-md", 
                isCompact ? "aspect-[2/3]" : "aspect-video"
              )}>
                {item.media.posterPath ? (
                  <Image
                    src={item.media.posterPath.startsWith('http') ? item.media.posterPath : `https://image.tmdb.org/t/p/w300${item.media.posterPath}`}
                    alt={item.media.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="200px"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[10px] text-gray-600">Sem Capa</div>
                )}
                
                {/* Nota no cantinho */}
                {item.rating && isCompact && (
                   <div className="absolute top-1 right-1 bg-black/70 text-yellow-400 text-[10px] font-bold px-1.5 rounded backdrop-blur-sm">
                      {item.rating}
                   </div>
                )}
              </div>

              {/* Título e Info */}
              <div className={cn("pt-2", isCompact ? "text-center" : "p-3")}>
                <h4 
                  className={cn(
                    "font-medium text-gray-300 group-hover:text-white transition-colors",
                    isCompact ? "text-xs line-clamp-1" : "text-sm line-clamp-1"
                  )} 
                  title={item.media.title}
                >
                  {item.media.title}
                </h4>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* PAGINAÇÃO COMPACTA */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2 border-t border-gray-800/50">
           <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 p-0 rounded-full hover:bg-gray-800">
              &lt;
           </Button>
           <span className="text-xs text-gray-500 font-mono">
              {page}/{totalPages}
           </span>
           <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 w-8 p-0 rounded-full hover:bg-gray-800">
              &gt;
           </Button>
        </div>
      )}
    </div>
  );
}