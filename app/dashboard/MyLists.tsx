"use client";

import { useState } from "react";
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

// Tipos
type MediaType = "MOVIE" | "SERIES" | "ANIME" | "OUTROS";
type MediaStatus = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";

type MediaItem = {
  id: string; // ID do MediaStatus
  title: string;
  // --- [CORREÇÃO 1] ---
  mediaType: MediaType; // Corrigido de 'type' para 'mediaType'
  // --- [FIM DA CORREÇÃO] ---
  posterPath: string; 
  status: MediaStatus;
  isWeekly?: boolean;
  lastSeason?: number;
  lastEpisode?: number;
  tmdbId: number;
  episodes?: number;
  seasons?: number;
  media: any; // Adicionado para compatibilidade
};

type MediaListsProps = {
  items: MediaItem[];
  counts: {
    TO_WATCH: number;
    WATCHING: number;
    WATCHED: number;
    DROPPED: number;
  };
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onUpdateStatus: (id: string, status: MediaItem['status']) => void;
  onRemove: (id: string) => void;
  onToggleWeekly: (id: string, isWeekly: boolean) => void;
};

export default function MyLists({
  items,
  counts,
  searchTerm,
  onSearchChange,
  onUpdateStatus,
  onRemove,
  onToggleWeekly,
}: MediaListsProps) {
  const [activeList, setActiveList] = useState<MediaStatus>("TO_WATCH");
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});

  const filteredByStatus = items.filter(
    (item) =>
      item.status === activeList &&
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: MediaType) => {
    switch (type) {
      case "MOVIE":
        return <Film className="h-5 w-5" />;
      case "SERIES":
        return <Tv className="h-5 w-5" />;
      case "ANIME":
        return <Play className="h-5 w-5" />;
      default:
        return <Film className="h-5 w-5" />;
    }
  };

  // Funções de API (Corrigidas)
  const handleStatusChange = async (id: string, newStatus: MediaStatus) => {
    const key = `${id}-status`;
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`/api/mediastatus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar');
      
      onUpdateStatus(id, newStatus);
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
      
      onRemove(id);
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
        body: JSON.stringify({ id, isWeekly }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar');
      
      onToggleWeekly(id, isWeekly);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };
  // Fim das Funções de API

  const renderMediaCard = (item: MediaItem) => {
    const isLoading = Object.values(loadingStates).some(val => val === true);
    
    return (
      <Card key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 shadow-sm">
        <ImageWithFallback
          src={item.posterPath} 
          alt={item.title}
          width={100}
          height={150}
          className="rounded-md object-cover mx-auto sm:mx-0"
        />
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-muted-foreground mb-1">
              {/* --- [CORREÇÃO 2] --- */}
              {getTypeIcon(item.mediaType)}
              <span className="text-xs uppercase">{item.mediaType}</span>
              {/* --- [FIM DA CORREÇÃO 2] --- */}
            </span>
            <h3 className="text-lg font-bold line-clamp-2">{item.title}</h3>
          </div>

          {/* --- [CORREÇÃO 3] --- */}
          {/* Adiciona a verificação item.mediaType !== "MOVIE" */}
          {item.status === "WATCHING" && item.mediaType !== "MOVIE" && (
            <div className="flex items-center gap-4 my-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`weekly-${item.id}`}
                  checked={item.isWeekly}
                  onCheckedChange={(checked) => handleToggleWeekly(item.id, !!checked)}
                  disabled={loadingStates[`${item.id}-weekly`]}
                />
                <Label htmlFor={`weekly-${item.id}`} className="text-sm cursor-pointer">
                  Ep. Semanal
                </Label>
              </div>
            </div>
          )}
          {/* --- [FIM DA CORREÇÃO 3] --- */}


          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Select
              value={item.status}
              onValueChange={(newStatus) => handleStatusChange(item.id, newStatus as MediaStatus)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-9 text-xs w-full sm:w-[150px]">
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
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isto irá remover "{item.title}" permanentemente das suas listas.
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
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-lg border-2">
        <CardContent className="p-4 sm:p-6">
          <Tabs
            value={activeList}
            onValueChange={(value) => setActiveList(value as MediaStatus)}
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

            <TabsContent value={activeList} className="space-y-4 pt-6">
              {filteredByStatus.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="mb-4 text-6xl opacity-30">
                    {getTypeIcon(
                      activeList === "WATCHING" ? "SERIES" : "MOVIE"
                    )}
                  </div>
                  <p className="font-semibold">Nenhum item nesta lista</p>
                  {searchTerm ? (
                    <p className="text-sm mt-2">Tente ajustar sua busca</p>
                  ) : (
                    <p className="text-sm mt-2">Adicione mídias usando a busca</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredByStatus.map(renderMediaCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}