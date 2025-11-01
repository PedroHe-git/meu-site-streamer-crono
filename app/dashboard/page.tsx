// app/darshbord/page.tsx (Atualizado com Botão de Tour na Sidebar)

"use client";

// 1. Importa 'useMemo' e os tipos do Joyride
import { useState, useEffect, useCallback, useMemo } from "react"; 
import { Step, STATUS, CallBackProps } from 'react-joyride'; 
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Media, MediaStatus, ScheduleItem, UserRole } from "@prisma/client";

import MediaSearch from "./MediaSearch";
import MyLists from "./MyLists";
import ScheduleManager from "./ScheduleManager";

// Imports de UI
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"; 
import AppTour from '@/app/components/AppTour'; 

// Tipagem
type MediaStatusWithMedia = MediaStatus & { media: Media; };
type ScheduleItemWithMedia = ScheduleItem & { media: Media; };
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";
type PaginatedListData = { items: MediaStatusWithMedia[]; totalCount: number; page: number; pageSize: number; };

// Define os passos do tour aqui
const STEP_PERFIL: Step = {
  target: '#tour-step-1-perfil',
  content: 'Bem-vindo! Aqui você pode personalizar sua página com uma mensagem.',
  placement: 'right',
};
const STEP_LISTAS: Step = {
  target: '#tour-step-2-listas-busca',
  content: 'Este é o seu painel principal. Pesquise filmes, animes, séries ou adicione manualmente, e organize-as em listas: "Para Assistir", "Assistindo".',
  placement: 'top',
};
const STEP_LISTAS_PARA_ASSISTIR: Step = {
  target: '#tour-step-lista-para-assistir',
  content: 'Essa lista é para os filmes que você pretende assistir, mas ainda não definiu uma data.',
  placement: 'top',
};
const STEP_LISTAS_PARA_ASSISINDO: Step = {
  target: '#tour-step-lista-assistindo',
  content: 'Aqui ficam os itens que já têm uma data prevista — prontos para você agendar quando quiser.',
  placement: 'top',
};
const STEP_LISTAS_PARA_JA_ASSISTIDO: Step = {
  target: '#tour-step-lista-ja-assistido',
  content: 'Essa lista armazena os itens já assistidos, mantendo o histórico atualizado.',
  placement: 'top',
};
const STEP_LISTAS_PARA_ABANDONADOS: Step = {
  target: '#tour-step-lista-abandonados',
  content: 'Essa lista armazena os itens que foram interrompidos ou não tiveram continuidade.',
  placement: 'top',
};
const STEP_AGENDA: Step = {
  target: '#tour-step-3-agenda',
  content: 'Organize seus episódios com o Gerir Agendamento! Escolha o item, defina a data e o horário (se quiser) e pronto!',
  placement: 'top',
};
const STEP_LISTA_PROX_AGENDA: Step = {
  target: '#tour-step-lista-agendamentos',
  content: 'Gerencie seus itens agendados. Ao assistir clique em CONCLUÍDO ou VISTO! Caso não conseguiu ver clique em REMOVER',
  placement: 'top',
};



export default function DashboardPage() {
  const { data: session, status } = useSession();

  // ... (Seus estados de 'toWatchData', etc. permanecem os mesmos) ...
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
  
  // @ts-ignore
  const userRole = session?.user?.role as UserRole | undefined;
  const isCreator = userRole === UserRole.CREATOR;
  // @ts-ignore
  const [bio, setBio] = useState(session?.user?.bio || "");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  // --- Lógica do Tour ---
  const [runTour, setRunTour] = useState(false);

  const tourSteps = useMemo(() => {
    const dynamicSteps: Step[] = [];
    if (isCreator) {
      dynamicSteps.push(STEP_PERFIL);
    }
    dynamicSteps.push(STEP_LISTAS);
    dynamicSteps.push(STEP_LISTAS_PARA_ASSISTIR);
    dynamicSteps.push(STEP_LISTAS_PARA_ASSISINDO);
    dynamicSteps.push(STEP_LISTAS_PARA_JA_ASSISTIDO);
    dynamicSteps.push(STEP_LISTAS_PARA_ABANDONADOS);
    dynamicSteps.push(STEP_AGENDA);
    dynamicSteps.push(STEP_LISTA_PROX_AGENDA);
    return dynamicSteps;
  }, [isCreator]);

  // useEffect para iniciar o tour
  useEffect(() => {
    if (status !== 'loading' && !isLoadingData) {
      const hasViewedTour = localStorage.getItem('meuCronogramaTourV1');
      if (!hasViewedTour) {
        setTimeout(() => {
          setRunTour(true);
        }, 500); 
      }
    }
  }, [isLoadingData, status]); 

  // Callback para parar o tour
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      localStorage.setItem('meuCronogramaTourV1', 'true');
      setRunTour(false);
    }
  };

  // --- [MUDANÇA 1: Função para o Botão Manual] ---
  // Esta é a nova função simplificada que o botão na sidebar irá chamar
  const handleStartTourClick = () => {
    // Limpa o localStorage para garantir que o tour corra
    localStorage.removeItem('meuCronogramaTourV1');
    
    // Reinicia o tour
    setRunTour(false);
    setTimeout(() => {
      setRunTour(true);
    }, 100); // Pequeno atraso para o Joyride re-renderizar
  };
  // --- [FIM MUDANÇA 1] ---
  
  // --- (O 'useEffect' que ouvia o 'start-tour' foi REMOVIDO) ---

  // ... (Efeito para carregar 'bio' permanece igual) ...
  useEffect(() => {
    if (session?.user) {
      // @ts-ignore
      setBio(session.user.bio || "");
    }
  }, [session?.user]);
  
  // ... (Todas as suas funções de busca de dados: fetchListData, fetchScheduleData, etc. permanecem iguais) ...
  const fetchListData = useCallback(async (listStatus: StatusKey, page: number = 1, search: string = "") => {
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

  const handleRemoveItem = async (item: MediaStatusWithMedia) => {
    setIsUpdating(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/mediastatus?id=${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Falha ao remover item`);
      }
      handleDataChanged(); 
    } catch (error: any) {
      console.error("Erro ao remover item:", error);
      setActionError(error.message);
      setIsUpdating(false);
    }
  };

   const handleSaveSettings = async () => {
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

  // Estados de Carregamento
  if (status === "loading" || (status === "authenticated" && isLoadingData)) { 
    return <p className="text-center p-10 text-muted-foreground">A carregar...</p>; 
  }
  if (status === "unauthenticated") { 
    if (typeof window !== 'undefined') { redirect("/auth/signin"); } 
    return <p className="text-center p-10 text-muted-foreground">Redirecionando...</p>; 
  }

  const firstName = session?.user?.name?.split(' ')[0] || session?.user?.username || "";

  // --- JSX ---
  return (
    <>
      {/* O AppTour "controlado" continua aqui */}
      <AppTour
        run={runTour}
        steps={tourSteps}
        onCallback={handleJoyrideCallback}
      />
      
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        <h1 className="text-3xl md:text-4xl font-semibold mb-8">
          Olá, {firstName}!
        </h1>

        {/* ... (Alertas) ... */}
        {isUpdating && ( <div className="fixed top-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse"> A atualizar... </div> )}
        {actionError && ( <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded relative" role="alert"> <strong className="font-bold">Erro: </strong> <span className="block sm:inline">{actionError}</span> <button onClick={() => setActionError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3"> <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Fechar</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg> </button> </div> )}


        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

           {/* 1. Sidebar */}
           <aside className="lg:w-1/4 space-y-6">
              
              {/* Card Definições */}
              {isCreator && (
                  <Card id="tour-step-1-perfil">
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

              {/* --- [MUDANÇA 2: Botão do Tour Manual] --- */}
              {/* Adiciona um botão de 'outline' na sidebar */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleStartTourClick} // Chama a nova função
              >
                Reiniciar Tour
              </Button>
              {/* --- [FIM MUDANÇA 2] --- */}

           </aside> 

           {/* 2. Conteúdo Principal */}
           <main className="flex-1 space-y-6">
               
               <Card id="tour-step-2-listas-busca">
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
                     onRemoveItem={handleRemoveItem} 
                   />
                 </CardContent>
               </Card>
               
               <Card id="tour-step-3-agenda">
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
    </>
  );
}