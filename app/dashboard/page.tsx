"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react"; // Usa import v4
import { redirect } from "next/navigation";
import { Media, MediaStatus, ScheduleItem, UserRole } from "@prisma/client";

import MediaSearch from "./MediaSearch";
import MyLists from "./MyLists";
import ScheduleManager from "./ScheduleManager";

// Importa componentes UI
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Remove Textarea, pois não é mais usado
// import { Textarea } from "@/components/ui/textarea"; 
// Remove cn, pois não é mais usado
// import { cn } from "@/lib/utils";


// Tipagem
type MediaStatusWithMedia = MediaStatus & { media: Media; };
type ScheduleItemWithMedia = ScheduleItem & { media: Media; };
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";
type PaginatedListData = { items: MediaStatusWithMedia[]; totalCount: number; page: number; pageSize: number; };

export default function DashboardPage() {
  const { data: session, status } = useSession();

  // Estados
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
  
  // Estados Apenas para Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  
  // --- [REMOVIDO] Estados de Personalização (bio, themeColor, etc.) ---
  // @ts-ignore
  // const userRole = session?.user?.role as UserRole | undefined;
  // const isCreator = userRole === UserRole.CREATOR;
  // const [bio, setBio] = useState(session?.user?.bio || "");
  // ... e outros estados relacionados ...
  // --- [FIM REMOÇÃO] ---


  // Efeito para carregar avatar inicial
  useEffect(() => {
    if (session?.user?.image && !avatarFile) {
      setAvatarPreview(session.user.image);
    }
  }, [session?.user?.image, avatarFile]);

  // fetchListData
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

  // handlePageChange
  const handlePageChange = (listStatus: StatusKey, newPage: number) => {
    // ... (lógica handlePageChange igual)
  };

   // Mapeamento dados paginados
   const paginatedDataMap: Record<StatusKey, PaginatedListData> = {
    TO_WATCH: toWatchData, WATCHING: watchingData, WATCHED: watchedData, DROPPED: droppedData,
  };

  // handleUpdateStatus
  const handleUpdateStatus = async (item: MediaStatusWithMedia, newStatus: StatusKey) => {
    // ... (lógica handleUpdateStatus igual)
  };

  // handleToggleWeekly
  const handleToggleWeekly = async (item: MediaStatusWithMedia) => {
    // ... (lógica handleToggleWeekly igual)
  };

  // handleDataChanged
  const handleDataChanged = () => {
    // ... (lógica handleDataChanged igual)
  };

  // Funções Upload Avatar (mantidas)
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) { if (file.size > 2 * 1024 * 1024) { setUploadMessage("Erro: Imagem > 2MB."); setAvatarFile(null); setAvatarPreview(session?.user?.image || null); return; } setAvatarFile(file); setUploadMessage(""); const reader = new FileReader(); reader.onloadend = () => { setAvatarPreview(reader.result as string); }; reader.readAsDataURL(file); } else { setAvatarFile(null); setAvatarPreview(null); } };
  const handleUploadAvatar = async () => { if (!avatarFile || !avatarPreview) return; setIsUploading(true); setUploadMessage("A enviar..."); try { const base64Image = avatarPreview; const res = await fetch('/api/profile/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: base64Image }), }); if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Falha ao guardar.'); } const { image: newImageUrl } = await res.json(); setUploadMessage("Avatar atualizado! Recarregue (F5) para ver na barra."); setAvatarFile(null); setAvatarPreview(newImageUrl); setTimeout(() => setUploadMessage(""), 4000); } catch (error: any) { console.error("Erro upload:", error); setUploadMessage(`Erro: ${error.message}`); } finally { setIsUploading(false); } };

  // --- [REMOVIDO] Função handleSaveSettings ---
  // const handleSaveSettings = async () => { ... };
  // --- [FIM REMOÇÃO] ---


  // Estados de Carregamento
  if (status === "loading" || (status === "authenticated" && isLoadingData)) {
    return <p className="text-center p-10 text-slate-500">A carregar...</p>;
  }
  if (status === "unauthenticated") {
    if (typeof window !== 'undefined') {
        redirect("/auth/signin");
    }
    return <p className="text-center p-10 text-slate-500">Redirecionando...</p>;
  }

  const firstName = session?.user?.name?.split(' ')[0] || session?.user?.username || "";

  // --- O Return Começa Aqui ---
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl text-slate-800">
      <h1 className="text-3xl md:text-4xl font-semibold mb-8 text-slate-800">
        Olá, {firstName}!
      </h1>

      {/* Indicador Global de Atualização */}
      {isUpdating && (
        <div className="fixed top-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          A atualizar...
        </div>
      )}

      {/* Mostra Erros de Ação */}
      {actionError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded relative" role="alert">
              <strong className="font-bold">Erro: </strong>
              <span className="block sm:inline">{actionError}</span>
              <button onClick={() => setActionError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                  <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Fechar</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
              </button>
          </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">

         {/* Coluna Esquerda: Perfil e Agendamentos */}
         <div className="lg:col-span-1 space-y-6">
            
            {/* Card Perfil/Avatar (Mantido) */}
            <Card>
               <CardHeader>
                  <CardTitle>Meu Perfil</CardTitle>
               </CardHeader>
               <CardContent className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                     <AvatarImage
                        key={session?.user?.image}
                        src={avatarFile ? avatarPreview ?? undefined : session?.user?.image ?? undefined}
                        alt={session?.user?.name || "Avatar"}
                      />
                     <AvatarFallback>{firstName ? firstName.substring(0, 1).toUpperCase() : "?"}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 w-full">
                     <Label htmlFor="avatar-upload" className="text-sm font-medium cursor-pointer text-indigo-600 hover:text-indigo-800 text-center block">
                        {avatarFile ? "Alterar imagem..." : "Carregar nova imagem..."}
                     </Label>
                     <Input id="avatar-upload" type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} className="hidden" disabled={isUploading} />
                  </div>
                  {avatarFile && ( <Button onClick={handleUploadAvatar} disabled={isUploading || !avatarPreview} className="w-full" size="sm" > {isUploading ? "A guardar..." : "Guardar Avatar"} </Button> )}
                  {avatarFile && avatarPreview && ( <img src={avatarPreview} alt="Preview" className="mt-2 h-16 w-16 rounded-full object-cover"/> )}
                  {uploadMessage && <p className={`text-sm ${uploadMessage.startsWith('Erro') ? 'text-red-600' : 'text-green-600'}`}>{uploadMessage}</p>}
               </CardContent>
            </Card>

            
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
             {/* Card 1: Busca */}
             <div className="bg-white shadow-lg rounded-xl p-6">
               <h2 className="text-2xl font-semibold mb-6 text-slate-700">1. Buscar Media</h2>
               <MediaSearch onMediaAdded={handleDataChanged} />
             </div>

             {/* Card 2: Listas */}
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
    </div> // Fim Container Principal
  ); // Fim Return
} // Fim Componente DashboardPage