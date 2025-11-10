"use client";

import { useState, useEffect, useCallback } from "react";
import { Film, Tv, Play, Check, X, Trash2, RefreshCw, ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Media, MediaStatus } from "@prisma/client"; // Importa os tipos

// --- [INÍCIO DA MUDANÇA 1] ---
// Tipos
type MediaType = "MOVIE" | "SERIES" | "ANIME" | "OUTROS";
type MediaStatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";
type MediaStatusWithMedia = MediaStatus & { media: Media };

// O tipo das props mudou. Já não recebe 'items' ou 'counts'.
type MediaListsProps = {
  // Recebe 'onDataChanged' para notificar o 'page.tsx'
  onDataChanged: () => void; 
};

// Definimos o tamanho da página aqui
const PAGE_SIZE = 10;
// --- [FIM DA MUDANÇA 1] ---


export default function MyLists({
  onDataChanged,
}: MediaListsProps) {
  
  // --- [INÍCIO DA MUDANÇA 2] ---
  // Este componente agora gere o seu próprio estado
  const [activeList, setActiveList] = useState<MediaStatusKey>("TO_WATCH");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<MediaStatusWithMedia[]>([]);
  const [counts, setCounts] = useState({
    TO_WATCH: 0, WATCHING: 0, WATCHED: 0, DROPPED: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});
  // --- [FIM DA MUDANÇA 2] ---


  // --- [INÍCIO DA MUDANÇA 3] ---
  // Função de busca de dados refatorada
  const fetchListData = useCallback(async (listStatus: MediaStatusKey, newPage: number, term: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: listStatus,
        page: newPage.toString(),
        pageSize: PAGE_SIZE.toString(),
        searchTerm: term,
      });

      const res = await fetch(`/api/mediastatus?${params.toString()}`);
      if (!res.ok) throw new Error("Falha ao carregar lista");
      
      const data = await res.json();
      setItems(data.items);
      setTotalCount(data.totalCount);
      setPage(newPage);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Sem dependências, é estável

  // Busca as contagens (apenas uma vez, ou quando a busca muda)
  const fetchCounts = useCallback(async (term: string) => {
    try {
      const statuses: MediaStatusKey[] = ["TO_WATCH", "WATCHING", "WATCHED", "DROPPED"];
      const countPromises = statuses.map(s => 
        fetch(`/api/mediastatus?status=${s}&page=1&pageSize=1&searchTerm=${term}`)
          .then(res => res.json())
          .then(data => ({ [s]: data.totalCount || 0 }))
      );
      
      const results = await Promise.all(countPromises);
      const newCounts = Object.assign({}, ...results) as typeof counts;
      setCounts(newCounts);

    } catch (error) {
      console.error("Falha ao buscar contagens", error);
    }
  }, []);

  // Efeito que reage à mudança de Aba ou Página
  useEffect(() => {
    fetchListData(activeList, page, searchTerm);
  }, [activeList, page, fetchListData, searchTerm]);

  // Efeito que reage à mudança do Termo de Busca
  useEffect(() => {
    // Quando o termo de busca muda, reseta a página para 1
    setPage(1); 
    // E atualiza as contagens
    fetchCounts(searchTerm);
    // O useEffect acima irá disparar e buscar os dados da lista
  }, [searchTerm, fetchCounts]);
  // --- [FIM DA MUDANÇA 3] ---


  const getTypeIcon = (type: MediaType) => {
    switch (type) {
      case "MOVIE": return <Film className="h-5 w-5" />;
      case "SERIES": return <Tv className="h-5 w-5" />;
      case "ANIME": return <Play className="h-5 w-5" />;
      default: return <Film className="h-5 w-5" />;
    }
  };

  // Funções de API (Corrigidas)
  const handleStatusChange = async (id: string, newStatus: MediaStatusKey) => {
    const key = `${id}-status`;
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`/api/mediastatus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, status: newStatus }), // 'id' é o MediaStatus ID
      });
      if (!res.ok) throw new Error('Falha ao atualizar');
      
      // Sucesso
      onDataChanged(); // Notifica o 'page.tsx' (para SchedManager/Calendar)
      fetchListData(activeList, page, searchTerm); // Re-busca a lista atual
      fetchCounts(searchTerm); // Re-busca contagens

    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRemove = async (id: string) => {
    const key = `${id}-remove`;
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`/api/mediastatus?id=${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Falha ao remover');
      
      // Sucesso
      onDataChanged(); // Notifica o 'page.tsx'
      fetchListData(activeList, page, searchTerm); // Re-busca a lista atual
      fetchCounts(searchTerm); // Re-busca contagens

    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };
  
  const handleToggleWeekly = async (id: string, isWeekly: boolean) => {
    const key = `${id}-weekly`;
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    try {
       const res = await fetch(`/api/mediastatus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, isWeekly: isWeekly }), // 'id' é o MediaStatus ID
      });
      if (!res.ok) throw new Error('Falha ao atualizar');
      
      // Sucesso
      onDataChanged(); // Notifica o 'page.tsx'
      fetchListData(activeList, page, searchTerm); // Re-busca a lista atual

    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };
  // Fim das Funções de API

  // --- [INÍCIO DA MUDANÇA 4] ---
  // Lógica de Paginação
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  // --- [FIM DA MUDANÇA 4] ---

  const renderMediaCard = (item: MediaStatusWithMedia) => {
    const isLoadingOp = Object.values(loadingStates).some(val => val === true);
    
    return (
      <Card key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 shadow-sm">
        <ImageWithFallback
          src={item.media.posterPath} 
          alt={item.media.title}
          width={100}
          height={150}
          className="rounded-md object-cover mx-auto sm:mx-0"
        />
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-muted-foreground mb-1">
              {getTypeIcon(item.media.mediaType)}
              <span className="text-xs uppercase">{item.media.mediaType}</span>
            </span>
            <h3 className="text-lg font-bold line-clamp-2">{item.media.title}</h3>
          </div>

          {item.status === "WATCHING" && item.media.mediaType !== "MOVIE" && (
            <div className="flex items-center gap-4 my-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`weekly-${item.id}`}
                  checked={item.isWeekly}
                  onCheckedChange={(checked) => handleToggleWeekly(item.id, !!checked)}
                  disabled={loadingStates[`${item.id}-weekly`] || isLoadingOp}
                />
                <Label htmlFor={`weekly-${item.id}`} className="text-sm cursor-pointer">
                  Ep. Semanal
                </Label>
              </div>
            </div>
          )}


          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Select
              value={item.status}
              onValueChange={(newStatus) => handleStatusChange(item.id, newStatus as MediaStatusKey)}
              disabled={isLoadingOp}
            >
              <SelectTrigger className="h-9 text-xs w-full sm:w-[170px]">
                <SelectValue placeholder="Mover para..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TO_WATCH">Próximos Conteúdos</SelectItem>
                <SelectItem value="WATCHING">Essa Semana</SelectItem>
                <SelectItem value="WATCHED">Assistidos</SelectItem>
                <SelectItem value="DROPPED">Abandonados</SelectItem>
              </SelectContent>
            </Select>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-red-600"
                  disabled={isLoadingOp}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isto irá remover &quot;{item.media.title}&quot; permanentemente das suas listas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleRemove(item.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            {loadingStates[`${item.id}-status`] || loadingStates[`${item.id}-remove`] || loadingStates[`${item.id}-weekly`] ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-2">
        <CardHeader>
          <CardTitle>Filtrar Minhas Listas</CardTitle>
          <CardDescription>
            Encontre rapidamente um item em todas as suas listas
          </CardDescription>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar nas suas listas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-lg border-2">
        <CardContent className="p-4 sm:p-6">
          <Tabs
            value={activeList}
            onValueChange={(value) => {
              setActiveList(value as MediaStatusKey);
              setPage(1); // Reseta a página ao mudar de aba
            }}
          >
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto sm:h-10">
              <TabsTrigger value="TO_WATCH" className="relative">
                <span className="hidden sm:inline">Próximos Conteúdos</span>
                <span className="sm:hidden">Ver</span>
                <Badge className="ml-2 bg-purple-600">{counts.TO_WATCH}</Badge>
              </TabsTrigger>
              <TabsTrigger value="WATCHING" className="relative">
                <span className="hidden sm:inline">Essa Semana</span>
                <span className="sm:hidden">Vendo</span>
                <Badge className="ml-2 bg-blue-600">{counts.WATCHING}</Badge>
              </TabsTrigger>
              <TabsTrigger value="WATCHED" className="relative">
                <span className="hidden sm:inline">Já Assistidos</span>
                <span className="sm:hidden">Vistos</span>
                <Badge className="ml-2 bg-green-600">{counts.WATCHED}</Badge>
              </TabsTrigger>
              <TabsTrigger value="DROPPED" className="relative">
                Abandonados
                <Badge className="ml-2 bg-orange-600">{counts.DROPPED}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* --- [INÍCIO DA MUDANÇA 5] --- */}
            {/* O conteúdo agora é dinâmico e mostra o estado de loading */}
            <div className="space-y-4 pt-6">
              {isLoading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="mb-4 text-6xl opacity-30">
                    {getTypeIcon(
                      activeList === "WATCHING" ? "SERIES" : "MOVIE"
                    )}
                  </div>
                  <p className="font-semibold">Nenhum item nesta lista</p>
                  {searchTerm ? (
                    <p className="text-sm mt-2">Nenhum resultado para &quot;{searchTerm}&quot;</p>
                  ) : (
                    <p className="text-sm mt-2">Adicione mídias usando a busca</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map(renderMediaCard)}
                </div>
              )}
              
              {/* Controles de Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages} (Total: {totalCount})
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
            {/* --- [FIM DA MUDANÇA 5] --- */}
            
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}