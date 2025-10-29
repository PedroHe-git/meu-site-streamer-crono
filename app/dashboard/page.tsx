"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Media, MediaStatus, ScheduleItem, UserRole } from "@prisma/client";

import MediaSearch from "./MediaSearch";
import MyLists from "./MyLists";
import ScheduleManager from "./ScheduleManager";

// Imports de UI (Avatar e cn removidos)
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"; 
// import { cn } from "@/lib/utils"; 

// Tipagem
type MediaStatusWithMedia = MediaStatus & { media: Media; };
type ScheduleItemWithMedia = ScheduleItem & { media: Media; };
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";
type PaginatedListData = { items: MediaStatusWithMedia[]; totalCount: number; page: number; pageSize: number; };

// Constante themeColors REMOVIDA

export default function DashboardPage() {
  const { data: session, status } = useSession();

  // Estados (sem avatar, cor, banner)
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

  // Estados Definições Perfil (Somente Bio)
  // @ts-ignore
  const userRole = session?.user?.role as UserRole | undefined;
  const isCreator = userRole === UserRole.CREATOR;
  // @ts-ignore
  const [bio, setBio] = useState(session?.user?.bio || "");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  // Efeito para carregar definições (Somente Bio)
  useEffect(() => {
    if (session?.user) {
      // @ts-ignore
      setBio(session.user.bio || "");
    }
  }, [session?.user]);
  
 const fetchListData = useCallback(async (listStatus: StatusKey, page: number = 1, search: string = "") => {
    // ... (lógica fetchListData igual)
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

  // fetchScheduleData
   const fetchScheduleData = async () => {
     // ... (lógica fetchScheduleData igual)
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

  // Efeito Inicial (busca tudo ao autenticar)
  useEffect(() => {
    // ... (lógica useEffect igual)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

   // Efeito SearchTerm (busca página 1 ao pesquisar)
   useEffect(() => {
     // ... (lógica useEffect igual)
     const handler = setTimeout(() => {
       if (status === "authenticated") {
         fetchListData("TO_WATCH", 1, searchTerm);
         fetchListData("WATCHING", 1, searchTerm);
         fetchListData("WATCHED", 1, searchTerm);
         fetchListData("DROPPED", 1, searchTerm);
       }
     }, 500);
     return () => clearTimeout(handler);
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [searchTerm, status]);
  
   const handleDataChanged = useCallback(() => {
    // Força o recarregamento de todas as listas e do agendamento
    // Usa o searchTerm atual e volta para a página 1
    setIsUpdating(true); // Mostra um feedback visual (opcional)
    Promise.all([
      fetchListData("TO_WATCH", 1, searchTerm),
      fetchListData("WATCHING", 1, searchTerm),
      fetchListData("WATCHED", 1, searchTerm),
      fetchListData("DROPPED", 1, searchTerm),
      fetchScheduleData()
    ]).finally(() => {
      setIsUpdating(false);
    });
  // Adiciona 'fetchListData' e 'searchTerm' como dependências
  }, [fetchListData, searchTerm]);

  const handlePageChange = (listStatus: StatusKey, newPage: number) => {
    const data = paginatedDataMap[listStatus];
    const totalPages = Math.ceil(data.totalCount / pageSize);

    // Validação para não buscar páginas que não existem
    if (newPage >= 1 && (newPage <= totalPages || totalPages === 0)) {
      fetchListData(listStatus, newPage, searchTerm);
    }
  };

  const handleUpdateStatus = async (item: MediaStatusWithMedia, newStatus: StatusKey) => {
    setIsUpdating(true); // Ativa o loading global
    setActionError(null);
    
    try {
      const res = await fetch("/api/mediastatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: item.mediaId, // ID da mídia para atualização
          status: newStatus,     // O novo status
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Falha ao atualizar status`);
      }
      handleDataChanged();
      } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      setActionError(error.message); // Mostra o erro na tela
    } finally {
      // O 'setIsUpdating(false)' será chamado pelo 'finally' do handleDataChanged
    }
  };

  const handleToggleWeekly = async (item: MediaStatusWithMedia) => {
    setIsUpdating(true);
    setActionError(null);
    const newIsWeekly = !item.isWeekly; // O valor oposto
    
    try {
      const res = await fetch("/api/mediastatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: item.mediaId,   // ID da mídia
          status: item.status,     // Mantém o status atual
          isWeekly: newIsWeekly, // Envia o novo valor
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao alternar status semanal");
      }

      // Se funcionou, recarrega os dados
      handleDataChanged();

    } catch (error: any) {
      console.error("Erro ao alternar status semanal:", error);
      setActionError(error.message);
    } finally {
      // O 'setIsUpdating(false)' será chamado pelo 'finally' do handleDataChanged
    }
  };


  const paginatedDataMap: Record<StatusKey, PaginatedListData> = { TO_WATCH: toWatchData, WATCHING: watchingData, WATCHED: watchedData, DROPPED: droppedData, };
  

  // Funções Definições Perfil (Somente Bio)
   const handleSaveSettings = async () => {
     if (!isCreator) return;
     setIsSavingSettings(true); setSettingsMessage("A guardar..."); setActionError(null);
     try {
       const payload = { bio: bio }; // Envia apenas a bio
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

  // Estados de Carregamento
  if (status === "loading" || (status === "authenticated" && isLoadingData)) { return <p className="text-center p-10 text-slate-500">A carregar...</p>; }
  if (status === "unauthenticated") { if (typeof window !== 'undefined') { redirect("/auth/signin"); } return <p className="text-center p-10 text-slate-500">Redirecionando...</p>; }

  const firstName = session?.user?.name?.split(' ')[0] || session?.user?.username || "";

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl text-slate-800">
      <h1 className="text-3xl md:text-4xl font-semibold mb-8 text-slate-800">
        Olá, {firstName}!
      </h1>

      {isUpdating && ( <div className="fixed top-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse"> A atualizar... </div> )}
      {actionError && ( <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded relative" role="alert"> <strong className="font-bold">Erro: </strong> <span className="block sm:inline">{actionError}</span> <button onClick={() => setActionError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3"> <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Fechar</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg> </button> </div> )}


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">

         {/* Coluna Esquerda: Definições e Agendamentos */}
         <div className="lg:col-span-1 space-y-6">
            
            {/* Card Definições (Só para CREATOR, Somente Bio) */}
            {isCreator && (
                <Card>
                    <CardHeader>
                        <CardTitle>Personalizar Perfil</CardTitle>
                        <CardDescription>Ajuste a sua página pública.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Bio */}
                        <div className="space-y-1">
                            <Label htmlFor="profile-bio">Bio Curta</Label>
                            <Textarea id="profile-bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Fale um pouco sobre si..." maxLength={200} className="h-24" disabled={isSavingSettings} />
                             <p className="text-xs text-muted-foreground">{200 - (bio?.length || 0)} caracteres restantes</p>
                        </div>
                        
                        {/* --- [REMOVIDO] Cor e Banner --- */}

                        <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full mt-2">
                           {isSavingSettings ? "A guardar..." : "Guardar Definições"}
                        </Button>
                        {settingsMessage && <p className={`text-sm text-center ${settingsMessage.startsWith('Erro') ? 'text-red-600' : 'text-green-600'}`}>{settingsMessage}</p>}
                    </CardContent>
                </Card>
            )}

             {/* Card 3: Agendamento */}
             <div className="bg-white shadow-lg rounded-xl p-6">
               <h2 className="text-2xl font-semibold mb-6 text-slate-700">3. Gerir Agendamentos</h2>
               <ScheduleManager
                 agendaveisList={watchingData.items}
                 initialScheduleItems={scheduleItems}
                 onScheduleChanged={handleDataChanged}
               />
             </div>
         </div> {/* Fim Coluna Esquerda */}

         {/* Coluna Direita: Busca e Listas */}
         <div className="lg:col-span-3 space-y-6">
             <div className="bg-white shadow-lg rounded-xl p-6"> <h2 className="text-2xl font-semibold mb-6 text-slate-700">1. Buscar Media</h2> <MediaSearch onMediaAdded={handleDataChanged} /> </div>
             <div className="bg-white shadow-lg rounded-xl p-6">
                 <h2 className="text-2xl font-semibold mb-6 text-slate-700">2. Minhas Listas</h2>
                 <MyLists
                   toWatchData={toWatchData} watchingData={watchingData} watchedData={watchedData} droppedData={droppedData}
                   onUpdateStatus={handleUpdateStatus} onPageChange={handlePageChange} onToggleWeekly={handleToggleWeekly}
                   listLoadingStatus={isListLoading} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                   isUpdatingGlobal={isUpdating}
                 />
             </div>
         </div> {/* Fim Coluna Direita */}

      </div> {/* Fim Grid Principal */}
    </div>
  );
}

