"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Film, List as ListIcon, Search } from "lucide-react";
import Image from "next/image";
import { Media, MediaStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// --- Tipos ---
type MediaStatusWithMedia = MediaStatus & { media: Media };
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";

interface MyListsProps {
  onDataChanged: () => void;
  dataVersionKey: number;
}

export default function MyLists({ onDataChanged, dataVersionKey }: MyListsProps) {
  const [activeList, setActiveList] = useState<StatusKey>("TO_WATCH");
  const [mediaItems, setMediaItems] = useState<MediaStatusWithMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para as contagens de cada lista
  const [counts, setCounts] = useState<Record<StatusKey, number>>({ 
    TO_WATCH: 0, 
    WATCHING: 0, 
    WATCHED: 0, 
    DROPPED: 0 
  });
  
  // Paginação e Busca
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState("");

  // Estados do Modal de Edição
  const [editingItem, setEditingItem] = useState<MediaStatusWithMedia | null>(null);
  const [newStatus, setNewStatus] = useState<StatusKey>("TO_WATCH");
  const [isWeekly, setIsWeekly] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados do Modal de Exclusão (AlertDialog)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Função para buscar as contagens de todas as listas ---
  const fetchCounts = useCallback(async () => {
    try {
      // Fazemos 4 requests rápidos (limit=1) apenas para pegar o 'totalCount' de cada status
      const statuses: StatusKey[] = ["TO_WATCH", "WATCHING", "WATCHED", "DROPPED"];
      
      const promises = statuses.map(status => 
        fetch(`/api/mediastatus?status=${status}&pageSize=1&page=1`).then(res => res.json())
      );

      const results = await Promise.all(promises);
      
      const newCounts: any = {};
      results.forEach((data, index) => {
        newCounts[statuses[index]] = data.totalCount;
      });

      setCounts(newCounts);
    } catch (error) {
      console.error("Erro ao buscar contagens", error);
    }
  }, []);

  // --- Função para buscar a lista atual ---
  const fetchListData = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        status: activeList,
        page: page.toString(),
        pageSize: pageSize.toString(),
        searchTerm: searchTerm,
      });

      const res = await fetch(`/api/mediastatus?${query.toString()}`);
      if (!res.ok) throw new Error("Falha ao carregar lista");
      
      const data = await res.json();
      
      if (page === 1) {
        setMediaItems(data.items);
      } else {
        setMediaItems(prev => [...prev, ...data.items]);
      }
      
      setHasMore(data.totalCount > page * pageSize);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [activeList, page, searchTerm]);

  // --- Efeito Principal: Reage à versão dos dados ---
  useEffect(() => {
    setPage(1); 
    fetchListData();
    fetchCounts(); // Atualiza também os contadores quando algo muda
  }, [fetchListData, fetchCounts, dataVersionKey]); 


  // --- Handlers de Edição ---
  const handleEditClick = (item: MediaStatusWithMedia) => {
    setEditingItem(item);
    setNewStatus(item.status);
    setIsWeekly(item.isWeekly);
    setIsEditOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/mediastatus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          status: newStatus,
          isWeekly: isWeekly
        })
      });

      if (!res.ok) throw new Error("Falha ao atualizar");

      setIsEditOpen(false);
      setEditingItem(null);
      onDataChanged(); 

    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Handlers de Exclusão (Atualizados para AlertDialog) ---
  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/mediastatus?id=${itemToDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Falha ao remover");
      
      onDataChanged(); 
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <>
      <Card className="shadow-md border-t-4 border-t-primary">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>As Minhas Listas</CardTitle>
              <CardDescription>Gerencie o que você está assistindo.</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar nesta lista..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} 
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeList} onValueChange={(v) => { setActiveList(v as StatusKey); setPage(1); }} className="w-full">
            
            {/* Lista de Abas com Badges de Contagem */}
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
              <TabsTrigger value="TO_WATCH" className="flex gap-2">
                Próximos Conteúdos <Badge variant="outline" className="border-purple-600 text-purple-600 ml-2">{counts.TO_WATCH}</Badge>
              </TabsTrigger>
              <TabsTrigger value="WATCHING" className="flex gap-2">
                Essa Semana <Badge variant="outline" className="border-blue-600 text-blue-600 ml-2">{counts.WATCHING}</Badge>
              </TabsTrigger>
              <TabsTrigger value="WATCHED" className="flex gap-2">
                Já Assisti <Badge variant="outline" className="border-green-600 text-green-600 ml-2">{counts.WATCHED}</Badge>
              </TabsTrigger>
              <TabsTrigger value="DROPPED" className="flex gap-2">
                Abandonado <Badge variant="outline" className="border-orange-600 text-orange-600 ml-2">{counts.DROPPED}</Badge>
              </TabsTrigger>
            </TabsList>

            <div className="min-h-[300px]">
              {isLoading && page === 1 ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <ListIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum item encontrado nesta lista.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {mediaItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                      <div className="relative aspect-[2/3] w-full overflow-hidden">
                        {item.media.posterPath ? (
                          <Image
                            src={item.media.posterPath}
                            alt={item.media.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Film className="h-12 w-12 text-muted-foreground opacity-50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 p-4">
                          <Button size="sm" variant="secondary" onClick={() => handleEditClick(item)}>
                            Mover / Editar
                          </Button>
                          {/* Botão de Exclusão atualizado */}
                          <Button size="icon" variant="destructive" onClick={() => handleDeleteClick(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="shadow-sm backdrop-blur-md bg-black/50 text-white border-0">
                            {item.media.mediaType === 'MOVIE' ? 'Filme' : 
                             item.media.mediaType === 'SERIES' ? 'Série' : 
                             item.media.mediaType === 'ANIME' ? 'Anime' : 'Outro'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="p-3 space-y-1">
                        <h3 className="font-semibold truncate" title={item.media.title}>{item.media.title}</h3>
                        {item.isWeekly && (
                          <Badge variant="outline" className="text-xs border-blue-500 text-blue-500">Semanal</Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              {hasMore && (
                <div className="mt-6 text-center">
                  <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Carregar Mais
                  </Button>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <CardDescription>{editingItem?.media.title}</CardDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mover para a lista:</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as StatusKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TO_WATCH">Próximos Conteudos (Futuro)</SelectItem>
                  <SelectItem value="WATCHING">Essa Semana (Para Agendar)</SelectItem>
                  <SelectItem value="WATCHED">Já Assistidos (Concluído)</SelectItem>
                  <SelectItem value="DROPPED">Abandonados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 border p-3 rounded-md">
              <Switch id="weekly-mode" checked={isWeekly} onCheckedChange={setIsWeekly} />
              <div className="flex-1">
                <Label htmlFor="weekly-mode" className="cursor-pointer font-medium">Modo Semanal</Label>
                <p className="text-xs text-muted-foreground">Ative se este item sai um episódio por semana.</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Novo Modal de Exclusão (AlertDialog) */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente este item da sua lista e removerá quaisquer agendamentos pendentes associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "A remover..." : "Sim, remover item"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}