"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Media, MediaStatus, ScheduleItem } from "@prisma/client";

import MediaSearch from "./MediaSearch";
import MyLists from "./MyLists";
import ScheduleManager from "./ScheduleManager";

// Tipagem (sem mudanças)
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


  // fetchListData (sem mudanças)
  const fetchListData = useCallback(async (listStatus: StatusKey, page: number = 1, search: string = "") => { /* ... (igual) ... */ setIsListLoading(prev => ({ ...prev, [listStatus]: true })); try { const params = new URLSearchParams({ status: listStatus, page: page.toString(), pageSize: pageSize.toString(), }); if (search) { params.append('searchTerm', search); } const res = await fetch(`/api/mediastatus?${params.toString()}`); if (!res.ok) { throw new Error(`Falha ao buscar ${listStatus}`); } const data: PaginatedListData = await res.json(); switch (listStatus) { case "TO_WATCH": setToWatchData(data); break; case "WATCHING": setWatchingData(data); break; case "WATCHED": setWatchedData(data); break; case "DROPPED": setDroppedData(data); break; } setCurrentPage(prev => ({ ...prev, [listStatus]: page })); } catch (error) { console.error(`Erro ao buscar lista ${listStatus}:`, error); const emptyData = { items: [], totalCount: 0, page: 1, pageSize }; switch (listStatus) { case "TO_WATCH": setToWatchData(emptyData); break; case "WATCHING": setWatchingData(emptyData); break; case "WATCHED": setWatchedData(emptyData); break; case "DROPPED": setDroppedData(emptyData); break; } } finally { setIsListLoading(prev => ({ ...prev, [listStatus]: false })); } }, [pageSize]);
  // fetchScheduleData (sem mudanças)
   const fetchScheduleData = async () => { /* ... (igual) ... */ try { const resSchedule = await fetch("/api/schedule"); if (!resSchedule.ok) { throw new Error('Falha ao buscar schedule'); } const scheduleData = await resSchedule.json(); setScheduleItems(scheduleData); } catch (error) { console.error("Erro ao buscar schedule:", error); setScheduleItems([]); } };

  // Efeito Inicial (sem mudanças)
  useEffect(() => { if (status === "authenticated") { setIsLoadingData(true); Promise.all([ fetchListData("TO_WATCH", 1, ""), fetchListData("WATCHING", 1, ""), fetchListData("WATCHED", 1, ""), fetchListData("DROPPED", 1, ""), fetchScheduleData() ]).finally(() => setIsLoadingData(false)); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);
   // Efeito SearchTerm (sem mudanças)
   useEffect(() => { const handler = setTimeout(() => { if (status === "authenticated") { fetchListData("TO_WATCH", 1, searchTerm); fetchListData("WATCHING", 1, searchTerm); fetchListData("WATCHED", 1, searchTerm); fetchListData("DROPPED", 1, searchTerm); } }, 500); return () => clearTimeout(handler); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [searchTerm, status]);

  // handlePageChange (sem mudanças)
  const handlePageChange = (listStatus: StatusKey, newPage: number) => { /* ... (igual) ... */ if (newPage >= 1) { const totalPages = Math.ceil(paginatedDataMap[listStatus].totalCount / pageSize); if (newPage <= totalPages) { fetchListData(listStatus, newPage, searchTerm); } } };
  const paginatedDataMap: Record<StatusKey, PaginatedListData> = { TO_WATCH: toWatchData, WATCHING: watchingData, WATCHED: watchedData, DROPPED: droppedData, };

  // handleUpdateStatus (sem mudanças)
  const handleUpdateStatus = async (item: MediaStatusWithMedia, newStatus: StatusKey) => { /* ... (igual) ... */ setIsUpdating(true); try { const { media } = item; const res = await fetch("/api/mediastatus", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaId: media.id, mediaType: media.mediaType, tmdbId: media.tmdbId, malId: media.malId, title: media.title, posterPath: media.posterPath, releaseYear: media.releaseYear, status: newStatus, }), }); if (!res.ok) throw new Error("Falha ao atualizar o status"); await Promise.all([ fetchListData("TO_WATCH", 1, searchTerm), fetchListData("WATCHING", 1, searchTerm), fetchListData("WATCHED", 1, searchTerm), fetchListData("DROPPED", 1, searchTerm), fetchScheduleData() ]); } catch (error) { console.error("Erro ao atualizar status:", error); } finally { setIsUpdating(false); } };

  // --- [NOVO] Função para Toggle Semanal ---
  const handleToggleWeekly = async (item: MediaStatusWithMedia) => {
    // Só permite alternar se o item estiver em 'WATCHING'
    if (item.status !== 'WATCHING') return;

    const newIsWeekly = !item.isWeekly; // Inverte o valor atual
    setIsUpdating(true); // Usa o estado de loading global
    try {
      const { media } = item;
      const res = await fetch("/api/mediastatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: media.id, // Envia o ID para a API saber que é uma atualização
          isWeekly: newIsWeekly, // Envia o novo valor
          // Não precisa enviar status, a API só vai atualizar isWeekly
        }),
      });
      if (!res.ok) throw new Error("Falha ao alternar status semanal");

      // Atualiza o estado localmente para refletir a mudança imediatamente
      // (a API confirma, mas isto evita um reload completo desnecessário)
      setWatchingData(prev => ({
         ...prev,
         items: prev.items.map(i => i.id === item.id ? { ...i, isWeekly: newIsWeekly } : i)
      }));

      // Poderia recarregar apenas a lista WATCHING, mas recarregar tudo é mais simples
      // await fetchListData("WATCHING", currentPage.WATCHING, searchTerm);

    } catch (error) {
      console.error("Erro ao alternar status semanal:", error);
      // Poderia reverter a mudança visual aqui se a API falhar
    } finally {
      setIsUpdating(false);
    }
  };
  // --- [FIM NOVO] ---

  // handleDataChanged (sem mudanças)
  const handleDataChanged = () => { /* ... (igual) ... */ Promise.all([ fetchListData("TO_WATCH", 1, searchTerm), fetchListData("WATCHING", 1, searchTerm), fetchListData("WATCHED", 1, searchTerm), fetchListData("DROPPED", 1, searchTerm), fetchScheduleData() ]); };

  // --- Estados de Carregamento (Sem mudanças) ---
  if (status === "loading" || (status === "authenticated" && isLoadingData)) { /* ... */ return <p className="text-center p-10 text-slate-500">A carregar...</p>; }
  if (status === "unauthenticated") { /* ... */ redirect("/api/auth/signin"); }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl text-slate-800">
      {/* ... (Título e Indicador Global de Atualização iguais) ... */}
       <h1 className="text-3xl md:text-4xl font-semibold mb-8 text-slate-800"> Dashboard de {session?.user?.name || session?.user?.username || "Utilizador"} </h1>
       {isUpdating && ( <div className="fixed top-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse"> A atualizar... </div> )}


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Card 1: Busca (igual) */}
         <div className="bg-white shadow-lg rounded-xl p-6 lg:col-span-1"> <h2 className="text-2xl font-semibold mb-6 text-slate-700">1. Buscar Media</h2> <MediaSearch onMediaAdded={handleDataChanged} /> </div>

        {/* Card 2: Listas (Atualizado) */}
        <div className="bg-white shadow-lg rounded-xl p-6 lg:col-span-1">
          <h2 className="text-2xl font-semibold mb-6 text-slate-700">2. Minhas Listas</h2>
          {/* --- [MUDANÇA] Passa a nova função handleToggleWeekly --- */}
          <MyLists
            toWatchData={toWatchData}
            watchingData={watchingData}
            watchedData={watchedData}
            droppedData={droppedData}
            onUpdateStatus={handleUpdateStatus}
            onPageChange={handlePageChange}
            onToggleWeekly={handleToggleWeekly} // <-- Passa a nova função
            listLoadingStatus={isListLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isUpdatingGlobal={isUpdating}
          />
          {/* --- [FIM MUDANÇA] --- */}
        </div>

        {/* Card 3: Agendamento (igual) */}
         <div className="bg-white shadow-lg rounded-xl p-6 lg:col-span-1"> <h2 className="text-2xl font-semibold mb-6 text-slate-700">3. Gerir Agendamentos</h2> <ScheduleManager agendaveisList={watchingData.items} initialScheduleItems={scheduleItems} onScheduleChanged={handleDataChanged} /> </div>
      </div>
    </div>
  );
}

