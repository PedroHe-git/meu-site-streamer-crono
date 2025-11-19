"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Trash2,
  Film,
  List as ListIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  Play
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";

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
  const [updatingId, setUpdatingId] = useState<string | null>(null); // Estado para loading individual

  const [counts, setCounts] = useState<Record<StatusKey, number>>({
    TO_WATCH: 0,
    WATCHING: 0,
    WATCHED: 0,
    DROPPED: 0
  });

  // Estados de Paginação
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

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

  // Função para buscar as contagens de todas as listas
  const fetchCounts = useCallback(async () => {
    try {
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

  // Função para buscar dados da lista
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

      setMediaItems(data.items);
      setTotalCount(data.totalCount);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [activeList, page, searchTerm]);

  // Efeitos
  useEffect(() => {
    fetchListData();
  }, [fetchListData, dataVersionKey]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, dataVersionKey]);

  useEffect(() => {
    setPage(1);
  }, [activeList, searchTerm]);


  // --- Handler de Mudança Rápida de Status ---
  const handleStatusChange = async (mediaId: string, newStatus: string) => {
    setUpdatingId(mediaId);
    try {
      const res = await fetch(`/api/mediastatus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: mediaId,
          status: newStatus
        }),
      });

      if (!res.ok) throw new Error("Falha ao mover item");

      onDataChanged(); // Atualiza a lista globalmente

    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleWeekly = async (item: MediaStatusWithMedia) => {
    setUpdatingId(item.id);
    try {
      const res = await fetch('/api/mediastatus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status: item.status, // Mantém o status atual
          isWeekly: !item.isWeekly // Inverte o valor atual
        })
      });

      if (!res.ok) throw new Error("Falha ao atualizar");
      onDataChanged(); // Atualiza a UI

    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

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

  // --- Handlers de Exclusão ---
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

  const totalPages = Math.ceil(totalCount / pageSize);

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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeList} onValueChange={(v) => setActiveList(v as StatusKey)} className="w-full">

            {/* Lista de Abas */}
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
              <TabsTrigger value="TO_WATCH" className="flex gap-2">
                Próximos Conteúdos <Badge variant="outline" className="border-purple-600 text-purple-600 ml-2">{counts.TO_WATCH}</Badge>
              </TabsTrigger>
              <TabsTrigger value="WATCHING" className="flex gap-2">
                Essa Semana <Badge variant="outline" className="border-blue-600 text-blue-600 ml-2">{counts.WATCHING}</Badge>
              </TabsTrigger>
              <TabsTrigger value="WATCHED" className="flex gap-2">
                Assistidos <Badge variant="outline" className="border-green-600 text-green-600 ml-2">{counts.WATCHED}</Badge>
              </TabsTrigger>
              <TabsTrigger value="DROPPED" className="flex gap-2">
                Abandonados <Badge variant="outline" className="border-orange-600 text-orange-600 ml-2">{counts.DROPPED}</Badge>
              </TabsTrigger>
            </TabsList>

            <div className="min-h-[300px]">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <ListIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>
                    {searchTerm
                      ? `Nenhum item encontrado para "${searchTerm}".`
                      : "Nenhum item nesta lista."
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {mediaItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                      {/* Imagem (Sem overlay de botões) */}
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
                        {item.media.posterPath ? (
                          <Image
                            src={item.media.posterPath}
                            alt={item.media.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="h-12 w-12 text-muted-foreground opacity-50" />
                          </div>
                        )}

                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="shadow-sm backdrop-blur-md bg-black/50 text-white border-0 text-[10px] px-1.5 h-5">
                            {item.media.mediaType === 'MOVIE' ? 'Filme' :
                              item.media.mediaType === 'SERIES' ? 'Série' :
                                item.media.mediaType === 'ANIME' ? 'Anime' : 'Outro'}
                          </Badge>
                        </div>
                      </div>

                      {/* Corpo do Card */}
                      <div className="p-3 flex flex-col gap-2 flex-1">
                        <div>
                          <h3 className="font-semibold truncate text-sm" title={item.media.title}>{item.media.title}</h3>
                          {/* Badge Visual se for Semanal */}
                          {item.isWeekly && (
                            <Badge variant="outline" className="text-[10px] border-blue-500 text-blue-500 mt-1 h-5 px-1">
                              Semanal
                            </Badge>
                          )}
                        </div>

                        <div className="mt-auto pt-2 space-y-2">

                          {/* Botão Começar Agora */}
                          {item.status === 'TO_WATCH' && (
                            <Button
                              size="sm"
                              className="w-full bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                              onClick={() => handleStatusChange(item.id, 'WATCHING')}
                              disabled={updatingId === item.id}
                            >
                              {updatingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Play className="h-3 w-3 mr-1" /> Começar Agora</>}
                            </Button>
                          )}

                          {/* Select de Status */}
                          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                            {updatingId === item.id && item.status !== 'TO_WATCH' ? (
                              <div className="flex items-center justify-center w-full h-8 text-xs text-muted-foreground bg-muted/50 rounded">
                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                Movendo...
                              </div>
                            ) : (
                              <Select
                                defaultValue={item.status}
                                onValueChange={(value) => handleStatusChange(item.id, value)}
                                disabled={updatingId === item.id}
                              >
                                <SelectTrigger className="h-8 w-full text-xs border-input bg-background/50 hover:bg-accent transition-colors">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <ArrowRightLeft className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <span className="truncate">
                                      {item.status === 'TO_WATCH' && "Próximos Conteúdos"}
                                      {item.status === 'WATCHING' && "Essa Semana"}
                                      {item.status === 'WATCHED' && "Já Assistidos"}
                                      {item.status === 'DROPPED' && "Abandonado"}
                                    </span>
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TO_WATCH">Próximos Conteúdos</SelectItem>
                                  <SelectItem value="WATCHING">Essa Semana</SelectItem>
                                  <SelectItem value="WATCHED">Já Assistido</SelectItem>
                                  <SelectItem value="DROPPED">Abandonado</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          {/* --- [NOVA LINHA: Semanal + Lixeira] --- */}
                          <div className="flex items-center justify-between pt-2 border-t mt-1">

                            {/* Checkbox Semanal */}
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`weekly-${item.id}`}
                                checked={item.isWeekly}
                                onCheckedChange={() => toggleWeekly(item)}
                                disabled={updatingId === item.id}
                                className="h-4 w-4"
                              />
                              <Label
                                htmlFor={`weekly-${item.id}`}
                                className="text-xs text-muted-foreground cursor-pointer font-normal select-none hover:text-foreground transition-colors"
                              >
                                Ep. Semanal
                              </Label>
                            </div>

                            {/* Botão Excluir */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteClick(item.id)}
                              title="Remover item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          {/* --------------------------------------- */}

                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Paginação */}
              {totalPages > 1 && !isLoading && (
                <div className="flex justify-between items-center pt-6 mt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
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
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de Exclusão (AlertDialog) */}
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