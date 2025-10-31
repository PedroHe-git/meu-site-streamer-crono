// app/darshbord/page.tsx (Atualizado)

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Media, MediaStatus, ScheduleItem, UserRole } from "@prisma/client";

import MediaSearch from "./MediaSearch";
import MyLists from "./MyLists";
import ScheduleManager from "./ScheduleManager";

// Imports de UI (Todos os necessários)
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"; 

// Tipagem
type MediaStatusWithMedia = MediaStatus & { media: Media; };
type ScheduleItemWithMedia = ScheduleItem & { media: Media; };
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";
type PaginatedListData = { items: MediaStatusWithMedia[]; totalCount: number; page: number; pageSize: number; };

export default function DashboardPage() {
  const { data: session, status } = useSession();

  // Estados (sem mudanças)
  const [toWatchData, setToWatchData] = useState<PaginatedListData>({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  const [watchingData, setWatchingData] = useState<PaginatedListData>({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  const [watchedData, setWatchedData] = useState<PaginatedListData>({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  const [droppedData, setDroppedData] = useState<PaginatedListData>({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  const [scheduleItems, setScheduleItems] = useState<ScheduleItemWithMedia[]>([]);
  const [currentPage, setCurrentPage] = useState<Record<StatusKey, number>>({ TO_WATCH: 1, WATCHING: 1, WATCHED: 1, DROPPED: 1, });
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isListLoading, setIsListLoading] = useState<Record<StatusKey, boolean>>({ TO_WATCH: false, WATCHING: false, WATCHED: false, DROPPED: false });
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [bio, setBio] = useState(session?.user?.bio || "");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  // @ts-ignore
  const userRole = session?.user?.role as UserRole | undefined;
  const isCreator = userRole === UserRole.CREATOR;

  // Efeito para carregar definições (Bio)
  useEffect(() => {
    if (session?.user) {
      // @ts-ignore
      setBio(session.user.bio || "");
    }
  }, [session?.user]);
  
  // --- Funções de Busca (sem mudanças) ---
  const fetchListData = useCallback(async (listStatus: StatusKey, page: number = 1, search: string = "") => {
    // ... (código igual)
    setIsListLoading(prev => ({ ...prev, [listStatus]: true }));
    try {
      const params = new URLSearchParams({ status: listStatus, page: page.toString(), pageSize: pageSize.toString(), });
      if (search) { params.append('searchTerm', search); }
      const res = await fetch(`/api/mediastatus?${params.toString()}`);
      if (!res.ok) { throw new Error(`Falha ao buscar ${listStatus}`); }
      const data: PaginatedListData = await res.json();
      switch (listStatus) {
        case "TO_WATCH": setToWatchData(data); break;
        case "WATCHING": setWatchingData(data); break;
        case "WATCHED": setWatchedData(data); break;
        case "DROPPED": setDroppedData(data); break;
      }
      setCurrentPage(prev => ({ ...prev, [listStatus]: page }));
    } catch (error) {
      console.error(`Erro ao buscar lista ${listStatus}:`, error);
    } finally {
      setIsListLoading(prev => ({ ...prev, [listStatus]: false }));
    }
  }, [pageSize]);

  const fetchScheduleData = async () => {
    // ... (código igual)
     try {
      const resSchedule = await fetch("/api/schedule");
      if (!resSchedule.ok) { throw new Error('Falha ao buscar schedule'); }
      const scheduleData = await resSchedule.json();
      setScheduleItems(scheduleData);
    } catch (error) {
      console.error("Erro ao buscar schedule:", error);
      setScheduleItems([]);
    }
  };

  // Efeitos (sem mudanças)
  useEffect(() => {
    if (status === "authenticated") {
      setIsLoadingData(true);
      Promise.all([
        fetchListData("TO_WATCH", 1, ""),
        fetchListData("WATCHING", 1, ""),
        fetchListData("WATCHED", 1, ""),
        fetchListData("DROPPED", 1, ""),
        fetchScheduleData()
      ]).finally(() => setIsLoadingData(false));
    }
  }, [status, fetchListData]); 

  useEffect(() => {
    const handler = setTimeout(() => {
      if (status === "authenticated") {
        fetchListData("TO_WATCH", 1, searchTerm);
        fetchListData("WATCHING", 1, searchTerm);
        fetchListData("WATCHED", 1, searchTerm);
        fetchListData("DROPPED", 1, searchTerm);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, status, fetchListData]); 
  
  const paginatedDataMap: Record<StatusKey, PaginatedListData> = { TO_WATCH: toWatchData, WATCHING: watchingData, WATCHED: watchedData, DROPPED: droppedData, };

  // --- Funções de Ação (Adicionada handleRemoveItem) ---
  const handleDataChanged = useCallback(() => {
    setIsUpdating(true);
    Promise.all([
      fetchListData("TO_WATCH", 1, searchTerm),
      fetchListData("WATCHING", 1, searchTerm),
      fetchListData("WATCHED", 1, searchTerm),
      fetchListData("DROPPED", 1, searchTerm),
      fetchScheduleData()
    ]).finally(() => {
      setIsUpdating(false);
    });
  }, [fetchListData, searchTerm]); 

  const handlePageChange = (listStatus: StatusKey, newPage: number) => {
    const data = paginatedDataMap[listStatus];
    const totalPages = Math.ceil(data.totalCount / pageSize);
    if (newPage >= 1 && (newPage <= totalPages || totalPages === 0)) {
      fetchListData(listStatus, newPage, searchTerm);
    }
  };

  const handleUpdateStatus = async (item: MediaStatusWithMedia, newStatus: StatusKey) => {
    // ... (código igual)
    setIsUpdating(true);
    setActionError(null);
    try {
      const res = await fetch("/api/mediastatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: item.mediaId,
          status: newStatus,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || `Falha ao atualizar status`); }
      handleDataChanged(); 
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      setActionError(error.message);
      setIsUpdating(false); 
    }
  };

  const handleToggleWeekly = async (item: MediaStatusWithMedia) => {
    // ... (código igual)
    setIsUpdating(true);
    setActionError(null);
    const newIsWeekly = !item.isWeekly;
    try {
      const res = await fetch("/api/mediastatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: item.mediaId,
          status: item.status,
          isWeekly: newIsWeekly,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Falha ao alternar status semanal"); }
      handleDataChanged();
    } catch (error: any) {
      console.error("Erro ao alternar status semanal:", error);
      setActionError(error.message);
      setIsUpdating(false); 
    }
  };

  // --- [NOVA FUNÇÃO AQUI] ---
  const handleRemoveItem = async (item: MediaStatusWithMedia) => {
    setIsUpdating(true);
    setActionError(null);
    
    try {
      // Chama a nova API DELETE com o ID do *MediaStatus*
      const res = await fetch(`/api/mediastatus?id=${item.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Falha ao remover item`);
      }

      // Sucesso! Recarrega todos os dados
      handleDataChanged(); 

    } catch (error: any) {
      console.error("Erro ao remover item:", error);
      setActionError(error.message);
      setIsUpdating(false); // Garante que o loading pare em caso de erro
    }
    // O 'setIsUpdating(false)' será chamado pelo 'finally' do handleDataChanged
  };
  // --- [FIM DA NOVA FUNÇÃO] ---

  // Função Definições Perfil (Bio)
   const handleSaveSettings = async () => {
     // ... (código igual)
     if (!isCreator) return;
     setIsSavingSettings(true); setSettingsMessage("A guardar..."); setActionError(null);
     try {
       const payload = { bio: bio };
       const res = await fetch('/api/profile/settings', {
         method: 'PUT', headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload),
       });
       if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Falha ao guardar.'); }
       setSettingsMessage("Guardado!");
       setTimeout(() => setSettingsMessage(""), 4000);
     } catch (error: any) {
       console.error("Erro ao guardar definições:", error);
       setSettingsMessage(""); setActionError(`Erro: ${error.message}`);
     } finally {
       setIsSavingSettings(false);
     }
   };

  // Estados de Carregamento (sem mudanças)
  if (status === "loading" || (status === "authenticated" && isLoadingData)) { 
    return <p className="text-center p-10 text-muted-foreground">A carregar...</p>; 
  }
  if (status === "unauthenticated") { 
    if (typeof window !== 'undefined') { redirect("/auth/signin"); } 
    return <p className="text-center p-10 text-muted-foreground">Redirecionando...</p>; 
  }

  const firstName = session?.user?.name?.split(' ')[0] || session?.user?.username || "";

  // --- JSX (Layout Atualizado) ---
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
      <h1 className="text-3xl md:text-4xl font-semibold mb-8">
        Olá, {firstName}!
      </h1>

      {/* Alertas (sem mudanças) */}
      {isUpdating && ( <div className="fixed top-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse"> A atualizar... </div> )}
      {actionError && ( <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded relative" role="alert"> <strong className="font-bold">Erro: </strong> <span className="block sm:inline">{actionError}</span> <button onClick={() => setActionError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3"> <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Fechar</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg> </button> </div> )}

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

         {/* 1. Sidebar (Limpa) */}
         <aside className="lg:w-1/4 space-y-6">
            {isCreator && (
                <Card>
                    <CardHeader>
                        <CardTitle>Personalizar Perfil</CardTitle>
                        <CardDescription>Ajuste a sua página pública.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="profile-bio" className="text-sm font-medium text-foreground">Bio Curta</Label>
                            <Textarea id="profile-bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Fale um pouco sobre si..." maxLength={200} className="h-24 placeholder:text-muted-foreground" disabled={isSavingSettings} />
                             <p className="text-xs text-muted-foreground">{200 - (bio?.length || 0)} caracteres restantes</p>
                        </div>
                        <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full mt-2">
                           {isSavingSettings ? "A guardar..." : "Guardar Definições"}
                        </Button>
                        {settingsMessage && <p className={`text-sm text-center ${settingsMessage.startsWith('Erro') ? 'text-red-600' : 'text-green-600'}`}>{settingsMessage}</p>}
                    </CardContent>
                </Card>
            )}
         </aside> 

         {/* 2. Conteúdo Principal */}
         <main className="flex-1 space-y-6">
             <Card>
               <CardContent className="p-6">
                 <h2 className="text-2xl font-semibold mb-6">Minhas Listas & Busca</h2>
                 <MyLists
                   toWatchData={toWatchData} 
                   watchingData={watchingData} 
                   watchedData={watchedData} 
                   droppedData={droppedData}
                   onUpdateStatus={handleUpdateStatus} 
                   onPageChange={handlePageChange} 
                   onToggleWeekly={handleToggleWeekly}
                   listLoadingStatus={isListLoading} 
                   searchTerm={searchTerm} 
                   setSearchTerm={setSearchTerm}
                   isUpdatingGlobal={isUpdating}
                   onMediaAdded={handleDataChanged}
                   onRemoveItem={handleRemoveItem} // <-- [NOVA PROP AQUI]
                 />
               </CardContent>
             </Card>
             
             <Card>
               <CardContent className="p-6">
                 <h2 className="text-2xl font-semibold mb-6">Gerir Agendamentos</h2>
                 <ScheduleManager
                   agendaveisList={watchingData.items}
                   initialScheduleItems={scheduleItems}
                   onScheduleChanged={handleDataChanged}
                 />
               </CardContent>
             </Card>
         </main> 
      </div> 
    </div>
  );
}