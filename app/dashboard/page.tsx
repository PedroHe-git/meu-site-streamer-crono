// app/dashboard/page.tsx (Corrigido para flicker vertical e horizontal)

"use client";

// 1. Importações de Hooks e Tipos
import { 
  useState, useEffect, useCallback, useMemo, useRef, 
  ChangeEvent, SyntheticEvent 
} from "react";
import { Step, STATUS, CallBackProps } from 'react-joyride'; 
import { useSession, signIn } from "next-auth/react";
import { redirect } from "next/navigation";
import { Media, MediaStatus, ScheduleItem, UserRole, ProfileVisibility } from "@prisma/client";
import Image from "next/image"; 

// 2. Importações da Biblioteca de Corte
import ReactCrop, { 
  type Crop, 
  PixelCrop, 
  centerCrop, 
  makeAspectCrop 
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; 

// 3. Importações de Componentes
import MediaSearch from "./MediaSearch";
import MyLists from "./MyLists";
import ScheduleManager from "./ScheduleManager";
import FullCalendar from "./FullCalendar"; 

// 4. Importações de UI (shadcn)
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"; 
import AppTour from '@/app/components/AppTour'; 
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
import { Pen } from "lucide-react"; 
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

// ... (Tipagem e Passos do Tour - sem mudanças) ...
type MediaStatusWithMedia = MediaStatus & { media: Media; };
type ScheduleItemWithMedia = ScheduleItem & { media: Media; };
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";
type PaginatedListData = { items: MediaStatusWithMedia[]; totalCount: number; page: number; pageSize: number; };

// ... (Passos do Tour) ...
const STEP_PERFIL: Step = {
  target: '#tour-step-1-perfil',
  content: 'Bem-vindo! Aqui pode personalizar a sua página com um avatar, bio e definir a sua privacidade.',
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
const STEP_CALENDARIO: Step = {
  target: '#tour-step-4-calendario',
  content: 'Aqui tem uma visão completa do seu cronograma, mostrando todos os seus agendamentos passados e futuros.',
  placement: 'top',
};

// ... (Função centerAspectCrop - sem mudanças) ...
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}


export default function DashboardPage() {
  const { data: session, status, update: updateSession } = useSession();

  // ... (Estados das Listas - sem mudanças) ...
  const [toWatchData, setToWatchData] = useState<PaginatedListData>({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  const [watchingData, setWatchingData] = useState<PaginatedListData>({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  const [watchedData, setWatchedData] = useState<PaginatedListData>({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  const [droppedData, setDroppedData] = useState<PaginatedListData>({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  const [scheduleItems, setScheduleItems] = useState<ScheduleItemWithMedia[]>([]);
  
  // ... (Estados de UI e Paginação - sem mudanças) ...
  const [currentPage, setCurrentPage] = useState<Record<StatusKey, number>>({ TO_WATCH: 1, WATCHING: 1, WATCHED: 1, DROPPED: 1, });
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [isLoadingData, setIsLoadingData] = useState(true); 
  const [isListLoading, setIsListLoading] = useState<Record<StatusKey, boolean>>({ TO_WATCH: false, WATCHING: false, WATCHED: false, DROPPED: false });
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [calendarKey, setCalendarKey] = useState(0);
  
  // Estados de Definições de Perfil
  const userRole = session?.user?.role as UserRole | undefined;
  const isCreator = userRole === UserRole.CREATOR;
  const [bio, setBio] = useState(session?.user?.bio || "");
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>(session?.user?.profileVisibility || "PUBLIC");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  
  // --- [Estados para os Switches] ---
  const [showToWatch, setShowToWatch] = useState(session?.user?.showToWatchList ?? true);
  const [showWatching, setShowWatching] = useState(session?.user?.showWatchingList ?? true);
  const [showWatched, setShowWatched] = useState(session?.user?.showWatchedList ?? true);
  const [showDropped, setShowDropped] = useState(session?.user?.showDroppedList ?? true);
  // --- [FIM] ---

  // ... (Estados do Cropper - sem mudanças) ...
  const [previewImage, setPreviewImage] = useState<string | null>(null); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null); 
  const canvasRef = useRef<HTMLCanvasElement>(null); 
  const [imageSrc, setImageSrc] = useState(''); 
  const [crop, setCrop] = useState<Crop>(); 
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>(); 
  const [isCropperOpen, setIsCropperOpen] = useState(false); 
  const [aspect, setAspect] = useState<number | undefined>(1 / 1); 

  // ... (Lógica do Tour - sem mudanças) ...
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
    dynamicSteps.push(STEP_CALENDARIO); 
    return dynamicSteps;
  }, [isCreator]);

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

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      localStorage.setItem('meuCronogramaTourV1', 'true');
      setRunTour(false);
    }
  };
  
  const handleStartTourClick = () => {
    localStorage.removeItem('meuCronogramaTourV1');
    setRunTour(false);
    setTimeout(() => {
      setRunTour(true);
    }, 100);
  };

  // Carrega dados da sessão para os estados
  useEffect(() => {
    if (session?.user) {
      setBio(session.user.bio || "");
      setProfileVisibility(session.user.profileVisibility || "PUBLIC");
      if (!selectedFile) {
        setPreviewImage(session.user.image || null);
      } 
      // --- [Sincronizar estados da sessão] ---
      setShowToWatch(session.user.showToWatchList ?? true);
      setShowWatching(session.user.showWatchingList ?? true);
      setShowWatched(session.user.showWatchedList ?? true);
      setShowDropped(session.user.showDroppedList ?? true);
      // --- [FIM] ---
    }
  }, [session?.user]);
  
  // --- (Funções de Busca de Dados - sem mudanças) ---
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
      fetchScheduleData() // Busca dados para o ScheduleManager (lista)
    ]).finally(() => {
      setIsUpdating(false);
      setCalendarKey(prevKey => prevKey + 1); 
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
  // --- Fim das Funções de Busca de Dados ---


  // --- (Lógica do Avatar/Cropper - sem mudanças) ---
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); 
      const file = e.target.files[0];
      
      if (!file.type.startsWith("image/")) {
        setActionError("Ficheiro inválido. Por favor, selecione uma imagem.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setActionError("Imagem muito grande. O limite é 5MB.");
        return;
      }

      setImageSrc(URL.createObjectURL(file)); 
      setIsCropperOpen(true); 
      setActionError(null);
      setSettingsMessage("");
    }
  };

  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  const handleCropConfirm = async () => {
    const image = imgRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas || !completedCrop) {
      throw new Error('Recursos de corte não estão prontos');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Não foi possível obter o contexto 2D');
    }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    return new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Falha ao criar blob da imagem cortada'));
          return;
        }
        
        const croppedFile = new File([blob], "avatar.png", { type: "image/png" });
        setSelectedFile(croppedFile);
        setPreviewImage(URL.createObjectURL(croppedFile));
        setIsCropperOpen(false); 
        resolve();
      }, 'image/png');
    });
  };

  const handleAvatarUpload = async (): Promise<string> => {
    if (!selectedFile) {
      throw new Error("Nenhum ficheiro selecionado.");
    }
    
    setSettingsMessage("A fazer upload...");
    const formData = new FormData();
    formData.append("file", selectedFile); 

    const res = await fetch('/api/profile/upload', {
      method: 'POST',
      body: formData,
    });

    const { url: newImageUrl, error } = await res.json();
    if (!res.ok) {
      throw new Error(error || "Falha no upload");
    }
    return newImageUrl; 
  };
  
  // --- (handleSaveSettings - sem mudanças) ---
   const handleSaveSettings = async () => {
     if (!isCreator) return;
     
     setIsSavingSettings(true); 
     setSettingsMessage("A guardar..."); 
     setActionError(null);

     let newImageUrl = session?.user?.image || null;

     try {
       // Etapa 1: Fazer Upload da Imagem (se houver uma nova)
       if (selectedFile) {
         newImageUrl = await handleAvatarUpload(); 
         setSettingsMessage("Upload concluído, a guardar definições...");
       }

       // Etapa 2: Guardar Bio, Privacidade E NOVOS CAMPOS
       const payload = { 
         bio: bio,
         profileVisibility: profileVisibility,
         showToWatchList: showToWatch,
         showWatchingList: showWatching,
         showWatchedList: showWatched,
         showDroppedList: showDropped,
       };
       
       const res = await fetch('/api/profile/settings', {
         method: 'PUT', headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload),
       });
       
       if (!res.ok) { 
         const d = await res.json(); 
         throw new Error(d.error || 'Falha ao guardar definições.'); 
       }
       
       // A API agora retorna os campos atualizados
       const newSettings = await res.json();

       // Etapa 3: Atualizar a Sessão UMA VEZ
       if (updateSession) {
         await updateSession({
           ...session, 
           user: {
             ...session?.user, 
             image: newImageUrl, // Imagem (nova ou antiga)
             bio: newSettings.bio, // Bio (da resposta da API)
             profileVisibility: newSettings.profileVisibility, // Visibilidade (da API)
             // Adiciona os novos campos para atualizar a sessão localmente
             showToWatchList: newSettings.showToWatchList,
             showWatchingList: newSettings.showWatchingList,
             showWatchedList: newSettings.showWatchedList,
             showDroppedList: newSettings.showDroppedList,
           }
         });
       }

       // Etapa 4: Limpar e mostrar sucesso
       setSettingsMessage("Guardado!");
       setSelectedFile(null); 
       setPreviewImage(newImageUrl); 
       setTimeout(() => setSettingsMessage(""), 4000);
       
     } catch (error: any) {
       console.error("Erro ao guardar definições:", error);
       setSettingsMessage(""); 
       setActionError(`Erro: ${error.message}`);
       // Reverte a imagem de preview se o upload falhar mas a imagem foi selecionada
       if (selectedFile) {
         setPreviewImage(session?.user?.image || null);
       }
     } finally {
       setIsSavingSettings(false);
       if (fileInputRef.current) {
         fileInputRef.current.value = "";
       }
     }
   };
  // --- [FIM] ---


  if (status === "unauthenticated") { 
    if (typeof window !== 'undefined') { redirect("/auth/signin"); } 
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <p className="text-center pt-20 text-muted-foreground">Redirecionando...</p>
      </div>
    );
  }

  // --- [INÍCIO DA CORREÇÃO] ---
  // Move estas definições para ANTES do bloco de carregamento
  const firstName = session?.user?.name?.split(' ')[0] || session?.user?.username || "";
  const fallbackLetter = (session?.user?.name || session?.user?.username || "U").charAt(0).toUpperCase();

  // --- ESTADOS DE CARREGAMENTO (Com layout fixo para evitar flicker) ---
  if (status === "loading" || (status === "authenticated" && isLoadingData)) { 
    
    // Mantenha o esqueleto da página para evitar o "flicker"
    return (
      <>
        {/* Renderiza o AppTour e o Canvas mesmo durante o load */}
        <AppTour
          run={runTour}
          steps={tourSteps}
          onCallback={handleJoyrideCallback}
        />
        <canvas
          ref={canvasRef}
          style={{
            display: 'none',
            objectFit: 'contain',
          }}
        />
        {/* Não renderiza o Dialog do Cropper aqui */}

        {/* Contêiner principal (Layout Fixo) */}
        <div className="mx-auto max-w-5xl p-4 md:p-6">
          
          {/* O H1 já pode ser renderizado, pois {firstName} vem da sessão */}
          <h1 className="text-3xl md:text-4xl font-semibold mb-8">
            Olá, {firstName}!
          </h1>

          {/* O layout de 2 colunas também */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

             {/* 1. Sidebar (Renderiza O CONTEÚDO COMPLETO, pois depende apenas da sessão) */}
             <aside className="lg:w-1/4 space-y-6">
              
              {/* Card Definições */}
              {isCreator && (
                  <Card id="tour-step-1-perfil">
                      <CardHeader>
                          <CardTitle>Personalizar Perfil</CardTitle>
                          <CardDescription>Ajuste a sua página pública.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          
                          {/* UI do Avatar */}
                          <div className="flex flex-col items-center space-y-2">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange} 
                              accept="image/png, image/jpeg, image/gif"
                              className="hidden" 
                            />
                            <button
                              type="button"
                              onClick={handleAvatarClick}
                              className="relative group rounded-full"
                              title="Alterar avatar"
                              disabled={isSavingSettings}
                            >
                              <Avatar className="h-24 w-24 border-2 border-muted">
                                <AvatarImage 
                                  src={previewImage || undefined} 
                                  alt={session?.user?.username || "Avatar"} 
                                />
                                <AvatarFallback className="text-3xl">{fallbackLetter}</AvatarFallback>
                              </Avatar>
                              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Pen className="h-6 w-6 text-white" />
                              </div>
                            </button>
                            {!selectedFile && (
                              <p className="text-xs text-muted-foreground">Clique no avatar para alterar a imagem.</p>
                            )}
                            {selectedFile && (
                              <p className="text-xs text-blue-600 font-medium">Nova imagem pronta. Clique em &quot;Guardar&quot;.</p>
                            )}
                          </div>
                          
                          {/* Bio */}
                          <div className="space-y-1">
                              <Label htmlFor="profile-bio-skeleton" className="text-sm font-medium text-foreground">Bio Curta</Label>
                              <Textarea id="profile-bio-skeleton" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Fale um pouco sobre si..." maxLength={200} className="h-24 placeholder:text-muted-foreground" disabled={isSavingSettings} />
                               <p className="text-xs text-muted-foreground">{200 - (bio?.length || 0)} caracteres restantes</p>
                          </div>
                          
                          {/* Status da Live (Twitch) */}
                          <div className="space-y-2 pt-2">
                            <Label className="text-sm font-medium text-foreground">Status da Live (Twitch)</Label>
                            {session?.user?.twitchUsername ? (
                              <div className="flex items-center justify-between gap-2 rounded-md border border-input bg-background p-3">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6441a5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitch flex-shrink-0"><path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7"/></svg>
                                  <span className="text-sm font-medium text-foreground truncate" title={session.user.twitchUsername}>
                                    {session.user.twitchUsername}
                                  </span>
                                </div>
                                <span className="text-xs font-semibold text-green-600 flex-shrink-0">VINCULADO</span>
                              </div>
                            ) : (
                              <>
                                <p className="text-xs text-muted-foreground pb-1">Para exibir o indicador &quot;LIVE&quot; no seu perfil, vincule sua conta da Twitch.</p>
                                <Button 
                                  variant="outline" 
                                  className="w-full bg-[#6441a5] text-white hover:bg-[#583894]" 
                                  onClick={() => signIn("twitch")}
                                  disabled={isSavingSettings}
                                >
                                  Vincular com a Twitch
                                </Button>
                              </>
                            )}
                          </div>

                          {/* Privacidade */}
                          <div className="space-y-2 pt-2">
                            <Label className="text-sm font-medium text-foreground">Visibilidade do Perfil</Label>
                            <RadioGroup 
                              value={profileVisibility} 
                              onValueChange={(value: ProfileVisibility) => setProfileVisibility(value)}
                              disabled={isSavingSettings}
                              className="space-y-2 pt-1"
                            >
                              <Label 
                                htmlFor="visibility-public-skeleton" 
                                className="flex items-center space-x-3 rounded-md border bg-background p-3 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                              >
                                <RadioGroupItem value="PUBLIC" id="visibility-public-skeleton" />
                                <div className="flex flex-col">
                                  <span className="font-semibold text-foreground text-sm">Público</span>
                                  <span className="text-xs text-muted-foreground">Qualquer pessoa pode ver o seu perfil.</span>
                                </div>
                              </Label>
                              <Label 
                                htmlFor="visibility-followers-skeleton" 
                                className="flex items-center space-x-3 rounded-md border bg-background p-3 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                              >
                                <RadioGroupItem value="FOLLOWERS_ONLY" id="visibility-followers-skeleton" />
                                <div className="flex flex-col">
                                  <span className="font-semibold text-foreground text-sm">Privado (Seguidores)</span>
                                  <span className="text-xs text-muted-foreground">Apenas utilizadores que o seguem podem ver.</span>
                                </div>
                              </Label>
                            </RadioGroup>
                          </div>

                          {/* --- [Switches de Visibilidade] --- */}
                          <div className="space-y-2 pt-2">
                            <Label className="text-sm font-medium text-foreground">Visibilidade das Listas</Label>
                            <p className="text-xs text-muted-foreground">Escolha quais listas são visíveis na sua página pública.</p>
                            <div className="space-y-3 pt-2">
                              <div className="flex items-center justify-between rounded-md border p-3">
                                <Label htmlFor="showToWatch-skeleton" className="text-sm font-medium cursor-pointer">Para Assistir</Label>
                                <Switch id="showToWatch-skeleton" checked={showToWatch} onCheckedChange={setShowToWatch} disabled={isSavingSettings} />
                              </div>
                              <div className="flex items-center justify-between rounded-md border p-3">
                                <Label htmlFor="showWatching-skeleton" className="text-sm font-medium cursor-pointer">Assistindo</Label>
                                <Switch id="showWatching-skeleton" checked={showWatching} onCheckedChange={setShowWatching} disabled={isSavingSettings} />
                              </div>
                              <div className="flex items-center justify-between rounded-md border p-3">
                                <Label htmlFor="showWatched-skeleton" className="text-sm font-medium cursor-pointer">Já Assistido</Label>
                                <Switch id="showWatched-skeleton" checked={showWatched} onCheckedChange={setShowWatched} disabled={isSavingSettings} />
                              </div>
                              <div className="flex items-center justify-between rounded-md border p-3">
                                <Label htmlFor="showDropped-skeleton" className="text-sm font-medium cursor-pointer">Abandonados</Label>
                                <Switch id="showDropped-skeleton" checked={showDropped} onCheckedChange={setShowDropped} disabled={isSavingSettings} />
                              </div>
                            </div>
                          </div>
                          {/* --- [FIM] --- */}

                          {/* Botão de Guardar */}
                          <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full mt-2">
                             {isSavingSettings ? "A guardar..." : "Guardar Definições"}
                          </Button>
                          {settingsMessage && <p className={`text-sm text-center font-medium ${actionError ? 'text-red-600' : 'text-green-600'}`}>{settingsMessage}</p>}
                      </CardContent>
                  </Card>
              )}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleStartTourClick}
                disabled // Desabilita o botão de tour durante o load
              >
                Reiniciar Tour
              </Button>

           </aside>
           {/* --- [FIM DA CORREÇÃO DA SIDEBAR] --- */}

             {/* 2. Conteúdo Principal (Aqui mostramos o loading) */}
             {/* --- [CORREÇÃO HORIZONTAL] Adicionado w-0 --- */}
             <main className="flex-1 w-0 space-y-6">
                <Card>
                  <CardContent className="p-6 min-h-[300px] flex items-center justify-center">
                    <p className="text-center text-muted-foreground">A carregar listas...</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 min-h-[300px] flex items-center justify-center">
                    <p className="text-center text-muted-foreground">A carregar agendamentos...</p>
                  </CardContent>
                </Card>
                 <Card>
                  <CardContent className="p-6 min-h-[300px] flex items-center justify-center">
                    <p className="text-center text-muted-foreground">A carregar calendário...</p>
                  </CardContent>
                </Card>
             </main> 
          </div> 
        </div>
      </>
    ); 
  }
  // --- [FIM DA CORREÇÃO] ---

  // --- JSX (Conteúdo Carregado) ---
  return (
    <>
      <AppTour
        run={runTour}
        steps={tourSteps}
        onCallback={handleJoyrideCallback}
      />
      
      {/* Canvas Invisível para o corte */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'none',
          objectFit: 'contain',
        }}
      />

      {/* Modal (Dialog) do Cropper */}
      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cortar Imagem</DialogTitle>
          </DialogHeader>
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              circularCrop 
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                alt="Imagem para cortar"
                src={imageSrc}
                onLoad={onImageLoad}
                style={{ maxHeight: '70vh' }}
              />
            </ReactCrop>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleCropConfirm}>Confirmar Corte</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Contêiner principal (com layout fixo) */}
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <h1 className="text-3xl md:text-4xl font-semibold mb-8">
          Olá, {firstName}!
        </h1>

        {/* Alertas */}
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
                          
                          {/* UI do Avatar */}
                          <div className="flex flex-col items-center space-y-2">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange} 
                              accept="image/png, image/jpeg, image/gif"
                              className="hidden" 
                            />
                            <button
                              type="button"
                              onClick={handleAvatarClick}
                              className="relative group rounded-full"
                              title="Alterar avatar"
                              disabled={isSavingSettings}
                            >
                              <Avatar className="h-24 w-24 border-2 border-muted">
                                <AvatarImage 
                                  src={previewImage || undefined} 
                                  alt={session?.user?.username || "Avatar"} 
                                />
                                <AvatarFallback className="text-3xl">{fallbackLetter}</AvatarFallback>
                              </Avatar>
                              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Pen className="h-6 w-6 text-white" />
                              </div>
                            </button>
                            {!selectedFile && (
                              <p className="text-xs text-muted-foreground">Clique no avatar para alterar a imagem.</p>
                            )}
                            {selectedFile && (
                              <p className="text-xs text-blue-600 font-medium">Nova imagem pronta. Clique em &quot;Guardar&quot;.</p>
                            )}
                          </div>
                          
                          {/* Bio */}
                          <div className="space-y-1">
                              <Label htmlFor="profile-bio" className="text-sm font-medium text-foreground">Bio Curta</Label>
                              <Textarea id="profile-bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Fale um pouco sobre si..." maxLength={200} className="h-24 placeholder:text-muted-foreground" disabled={isSavingSettings} />
                               <p className="text-xs text-muted-foreground">{200 - (bio?.length || 0)} caracteres restantes</p>
                          </div>
                          
                          {/* Status da Live (Twitch) */}
                          <div className="space-y-2 pt-2">
                            <Label className="text-sm font-medium text-foreground">Status da Live (Twitch)</Label>
                            {session?.user?.twitchUsername ? (
                              <div className="flex items-center justify-between gap-2 rounded-md border border-input bg-background p-3">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6441a5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitch flex-shrink-0"><path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7"/></svg>
                                  <span className="text-sm font-medium text-foreground truncate" title={session.user.twitchUsername}>
                                    {session.user.twitchUsername}
                                  </span>
                                </div>
                                <span className="text-xs font-semibold text-green-600 flex-shrink-0">VINCULADO</span>
                              </div>
                            ) : (
                              <>
                                <p className="text-xs text-muted-foreground pb-1">Para exibir o indicador &quot;LIVE&quot; no seu perfil, vincule sua conta da Twitch.</p>
                                <Button 
                                  variant="outline" 
                                  className="w-full bg-[#6441a5] text-white hover:bg-[#583894]" 
                                  onClick={() => signIn("twitch")}
                                  disabled={isSavingSettings}
                                >
                                  Vincular com a Twitch
                                </Button>
                              </>
                            )}
                          </div>

                          {/* Privacidade */}
                          <div className="space-y-2 pt-2">
                            <Label className="text-sm font-medium text-foreground">Visibilidade do Perfil</Label>
                            <RadioGroup 
                              value={profileVisibility} 
                              onValueChange={(value: ProfileVisibility) => setProfileVisibility(value)}
                              disabled={isSavingSettings}
                              className="space-y-2 pt-1"
                            >
                              <Label 
                                htmlFor="visibility-public" 
                                className="flex items-center space-x-3 rounded-md border bg-background p-3 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                              >
                                <RadioGroupItem value="PUBLIC" id="visibility-public" />
                                <div className="flex flex-col">
                                  <span className="font-semibold text-foreground text-sm">Público</span>
                                  <span className="text-xs text-muted-foreground">Qualquer pessoa pode ver o seu perfil.</span>
                                </div>
                              </Label>
                              <Label 
                                htmlFor="visibility-followers" 
                                className="flex items-center space-x-3 rounded-md border bg-background p-3 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                              >
                                <RadioGroupItem value="FOLLOWERS_ONLY" id="visibility-followers" />
                                <div className="flex flex-col">
                                  <span className="font-semibold text-foreground text-sm">Privado (Seguidores)</span>
                                  <span className="text-xs text-muted-foreground">Apenas utilizadores que o seguem podem ver.</span>
                                </div>
                              </Label>
                            </RadioGroup>
                          </div>

                          {/* --- [Switches de Visibilidade] --- */}
                          <div className="space-y-2 pt-2">
                            <Label className="text-sm font-medium text-foreground">Visibilidade das Listas</Label>
                            <p className="text-xs text-muted-foreground">Escolha quais listas são visíveis na sua página pública.</p>
                            <div className="space-y-3 pt-2">
                              <div className="flex items-center justify-between rounded-md border p-3">
                                <Label htmlFor="showToWatch" className="text-sm font-medium cursor-pointer">Para Assistir</Label>
                                <Switch id="showToWatch" checked={showToWatch} onCheckedChange={setShowToWatch} disabled={isSavingSettings} />
                              </div>
                              <div className="flex items-center justify-between rounded-md border p-3">
                                <Label htmlFor="showWatching" className="text-sm font-medium cursor-pointer">Assistindo</Label>
                                <Switch id="showWatching" checked={showWatching} onCheckedChange={setShowWatching} disabled={isSavingSettings} />
                              </div>
                              <div className="flex items-center justify-between rounded-md border p-3">
                                <Label htmlFor="showWatched" className="text-sm font-medium cursor-pointer">Já Assistido</Label>
                                <Switch id="showWatched" checked={showWatched} onCheckedChange={setShowWatched} disabled={isSavingSettings} />
                              </div>
                              <div className="flex items-center justify-between rounded-md border p-3">
                                <Label htmlFor="showDropped" className="text-sm font-medium cursor-pointer">Abandonados</Label>
                                <Switch id="showDropped" checked={showDropped} onCheckedChange={setShowDropped} disabled={isSavingSettings} />
                              </div>
                            </div>
                          </div>
                          {/* --- [FIM] --- */}

                          {/* Botão de Guardar */}
                          <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full mt-2">
                             {isSavingSettings ? "A guardar..." : "Guardar Definições"}
                          </Button>
                          {settingsMessage && <p className={`text-sm text-center font-medium ${actionError ? 'text-red-600' : 'text-green-600'}`}>{settingsMessage}</p>}
                      </CardContent>
                  </Card>
              )}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleStartTourClick}
              >
                Reiniciar Tour
              </Button>

           </aside> 

           {/* 2. Conteúdo Principal */}
           {/* --- [CORREÇÃO HORIZONTAL] Adicionado w-0 --- */}
           <main className="flex-1 w-0 space-y-6">
               
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

               <Card id="tour-step-4-calendario">
                 <CardHeader>
                   <CardTitle>Calendário Completo</CardTitle>
                   <CardDescription>
                     Uma visão geral de todos os seus agendamentos, passados e futuros.
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <FullCalendar key={calendarKey} /> 
                 </CardContent>
               </Card>
           </main> 
        </div> 
      </div>
    </>
  );
}