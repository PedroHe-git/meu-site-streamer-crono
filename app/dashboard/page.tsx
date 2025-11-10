// app/dashboard/page.tsx (Layout Sidebar + 3 Abas)

"use client";

// 1. Importações de Hooks e Tipos
import { 
  useState, useEffect, useCallback, useMemo, useRef, 
  ChangeEvent, SyntheticEvent 
} from "react";
// @ts-ignore (Joyride tem problemas de tipo conhecidos)
import { Step, STATUS, CallBackProps, Props } from 'react-joyride'; 
import { useSession, signIn } from "next-auth/react";
import { redirect } from "next/navigation";
import { Media, MediaStatus, ScheduleItem, UserRole, ProfileVisibility } from "@prisma/client";
import Image from "next/image"; 
import { Input } from "@/components/ui/input";

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
import { Pen, Settings, List, CalendarDays, Calendar, Loader2, Check } from "lucide-react"; 
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert"; 

// --- Tipos (Definidos no topo para clareza) ---
type MediaStatusWithMedia = MediaStatus & { media: Media; };
type ScheduleItemWithMedia = ScheduleItem & { media: Media; };
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";
type MediaType = "MOVIE" | "SERIES" | "ANIME" | "OUTROS"; 

// Mapeia os dados brutos da DB para um tipo consistente que o frontend espera
type MappedMediaItem = {
  id: string; // ID do MediaStatus
  userId: string; // ID do Utilizador
  mediaId: string; // ID da Media
  title: string;
  mediaType: MediaType; 
  posterPath: string;
  status: StatusKey;
  isWeekly?: boolean;
  lastSeason?: number;
  lastEpisode?: number;
  tmdbId: number | null; 
  malId: number | null; 
  episodes?: number; 
  seasons?: number; 
  media: Media; // Inclui o objeto 'media' original
};

// Este tipo agora é usado pelo ScheduleManager e pelo FullCalendar
type MappedScheduleItem = ScheduleItemWithMedia & {
  scheduledAt: Date; // Garantimos que a data é um objeto Date
};


// --- Passos do Tour (do seu ficheiro original) ---
const STEP_PERFIL: Step = {
  target: '#tour-step-1-perfil',
  content: 'Bem-vindo! Aqui pode personalizar a sua página com um avatar, bio e definir a sua privacidade.',
  placement: 'right',
};
const STEP_LISTAS: Step = {
  target: '#tour-step-2-listas-busca',
  content: 'Este é o seu painel principal. Pesquise filmes, animes, séries ou adicione manualmente, e organize-as em listas: "Próximo Conteúdo", "Essa Semana".',
  placement: 'top',
};
const STEP_LISTAS_PARA_ASSISTIR: Step = { target: '#tour-step-lista-para-assistir', content: 'Essa lista é para os filmes que você pretende assistir, mas ainda não definiu uma data.', placement: 'top', } as Step;
const STEP_LISTAS_PARA_ASSISINDO: Step = { target: '#tour-step-lista-assistindo', content: 'Aqui ficam os itens que já têm uma data prevista — prontos para você agendar quando quiser.', placement: 'top', } as Step;
const STEP_LISTAS_PARA_JA_ASSISTIDO: Step = { target: '#tour-step-lista-ja-assistido', content: 'Essa lista armazena os itens já assistidos, mantendo o histórico atualizado.', placement: 'top', } as Step;
const STEP_LISTAS_PARA_ABANDONADOS: Step = { target: '#tour-step-lista-abandonados', content: 'Essa lista armazena os itens que foram interrompidos ou não tiveram continuidade.', placement: 'top', } as Step;
const STEP_AGENDA: Step = { target: '#tour-step-3-agenda', content: 'Organize seus episódios com o Gerir Agendamento! Escolha o item, defina a data e o horário (se quiser) e pronto!', placement: 'top', } as Step;
const STEP_LISTA_PROX_AGENDA: Step = { target: '#tour-step-lista-agendamentos', content: 'Gerencie seus itens agendados. Ao assistir clique em CONCLUÍDO ou VISTO! Caso não conseguiu ver clique em REMOVER', placement: 'top', } as Step;
const STEP_CALENDARIO: Step = { target: '#tour-step-4-calendario', content: 'Aqui tem uma visão completa do seu cronograma, mostrando todos os seus agendamentos passados e futuros.', placement: 'top', } as Step;
// --- Fim dos Passos do Tour ---

// --- Função centerAspectCrop (do seu ficheiro original) ---
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
// --- Fim centerAspectCrop ---


export default function DashboardPage() {
  const { data: session, status, update: updateSession } = useSession();

  // --- [INÍCIO DA MUDANÇA 1] ---
  // Estados dos Dados Brutos (vindos da API)
  // 'initialMediaItems' agora só guarda os itens de 'WATCHING'
  const [initialMediaItems, setInitialMediaItems] = useState<MediaStatusWithMedia[]>([]); 
  const [initialScheduleItems, setInitialScheduleItems] = useState<ScheduleItemWithMedia[]>([]);
  
  // Estados de UI
  // 'searchTerm' e 'counts' foram MOVIDOS para o MyLists.tsx
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [calendarKey, setCalendarKey] = useState(0);
  // --- [FIM DA MUDANÇA 1] ---
  
  // Estados de Definições de Perfil (do seu ficheiro Git)
  // @ts-ignore
  const userRole = session?.user?.role as UserRole | undefined;
  const isCreator = userRole === UserRole.CREATOR;
  
  // @ts-ignore
  const [displayName, setDisplayName] = useState(session?.user?.name || "");
  // @ts-ignore
  const [bio, setBio] = useState(session?.user?.bio || "");
  // @ts-ignore
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>(session?.user?.profileVisibility || "PUBLIC");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  
  // @ts-ignore
  const [showToWatch, setShowToWatch] = useState(session?.user?.showToWatchList ?? true);
  // @ts-ignore
  const [showWatching, setShowWatching] = useState(session?.user?.showWatchingList ?? true);
  // @ts-ignore
  const [showWatched, setShowWatched] = useState(session?.user?.showWatchedList ?? true);
  // @ts-ignore
  const [showDropped, setShowDropped] = useState(session?.user?.showDroppedList ?? true);

  // Estados do Cropper (do seu ficheiro Git)
  const [previewImage, setPreviewImage] = useState<string | null>(null); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null); 
  const canvasRef = useRef<HTMLCanvasElement>(null); 
  const [imageSrc, setImageSrc] = useState(''); 
  const [crop, setCrop] = useState<Crop>(); 
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>(); 
  const [isCropperOpen, setIsCropperOpen] = useState(false); 
  const avatarAspect = 1 / 1;

  // --- [NOVO] Estados do Cropper (Banner) ---
  const [previewBanner, setPreviewBanner] = useState<string | null>(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const bannerImgRef = useRef<HTMLImageElement>(null);
  const [bannerImageSrc, setBannerImageSrc] = useState('');
  const [bannerCrop, setBannerCrop] = useState<Crop>();
  const [completedBannerCrop, setCompletedBannerCrop] = useState<PixelCrop>();
  const [isBannerCropperOpen, setIsBannerCropperOpen] = useState(false);
  const bannerAspect = 16 / 9; // Proporção do Banner
  // --- [FIM NOVO] ---

  // Lógica do Tour (do seu ficheiro Git)
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
    if (status !== 'loading' && !isLoading) {
      const hasViewedTour = localStorage.getItem('meuCronogramaTourV1');
      if (!hasViewedTour) {
        setTimeout(() => { setRunTour(true); }, 500); 
      }
    }
  }, [isLoading, status]); 

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
    setTimeout(() => { setRunTour(true); }, 100);
  };

  // Carrega dados da sessão para os estados (Atualizado)
  useEffect(() => {
    if (session?.user) {
      setDisplayName(session.user.name || "");
      // @ts-ignore
      setBio(session.user.bio || "");
      // @ts-ignore
      setProfileVisibility(session.user.profileVisibility || "PUBLIC");
      
      if (!selectedFile) {
        setPreviewImage(session.user.image || null);
      }
      
      if (!selectedBannerFile) {
        // @ts-ignore
        setPreviewBanner(session.user.profileBannerUrl || null);
      }
      // @ts-ignore
      setShowToWatch(session.user.showToWatchList ?? true);
      // @ts-ignore
      setShowWatching(session.user.showWatchingList ?? true);
      // @ts-ignore
      setShowWatched(session.user.showWatchedList ?? true);
      // @ts-ignore
      setShowDropped(session.user.showDroppedList ?? true);
    }
  }, [session?.user, selectedFile, selectedBannerFile]);
  
  // --- [INÍCIO DA MUDANÇA 2] ---
  // Função de Busca de Dados (Refatorada)
  // Agora busca apenas os dados 'compartilhados'
  const fetchSharedData = useCallback(async () => {
    setIsUpdating(true);
    try {
      // 1. Buscar Lista "WATCHING" (necessária para ScheduleManager)
      // Usamos pageSize=999 para garantir que buscamos todos (lista 'watching' é pequena)
      const resWatching = await fetch(`/api/mediastatus?status=WATCHING&page=1&pageSize=999&searchTerm=`);
      if (!resWatching.ok) throw new Error(`Falha ao buscar a lista WATCHING`);
      const watchingData = await resWatching.json();
      setInitialMediaItems(watchingData.items); // Guarda apenas a lista watching

      // 2. Buscar Agenda (necessária para ScheduleManager e FullCalendar)
      const resSchedule = await fetch(`/api/schedule?list=pending`);
      if (!resSchedule.ok) throw new Error('Falha ao buscar schedule');
      const scheduleData = await resSchedule.json();
      setInitialScheduleItems(scheduleData);

    } catch (error) {
      console.error("Erro ao buscar dados compartilhados:", error);
      setActionError("Falha ao carregar dados do dashboard.");
      setInitialScheduleItems([]); 
    } finally {
      setIsUpdating(false);
      setIsLoading(false); 
    }
  }, []); // Removemos 'searchTerm' das dependências

  // Efeito para busca inicial
  useEffect(() => {
    if (status === "authenticated") {
      fetchSharedData();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
      if (typeof window !== 'undefined') { redirect("/auth/signin"); } 
    }
  }, [status, fetchSharedData]); // Removemos 'searchTerm'
  // --- [FIM DA MUDANÇA 2] ---

  
  // --- Funções de Mapeamento (para corrigir tipos Date e adicionar campos em falta) ---
  // (mapDataToMediaItems foi simplificado, pois só recebe 'WATCHING')
  const mapDataToMediaItems = (dataItems: MediaStatusWithMedia[]): MappedMediaItem[] => {
    return dataItems.map((item) => ({
      ...item,
      id: item.id, 
      userId: item.userId,
      mediaId: item.media.id, 
      title: item.media.title,
      mediaType: item.media.mediaType,
      posterPath: item.media.posterPath || "",
      tmdbId: item.media.tmdbId, 
      malId: item.media.malId, 
      // @ts-ignore
      episodes: item.media.episodes || 0,
      // @ts-ignore
      seasons: item.media.seasons || 0,
      media: item.media, 
    }));
  };

  const mapDataToScheduleItems = (dataItems: ScheduleItemWithMedia[]): MappedScheduleItem[] => {
    return dataItems.map((item) => ({
      ...item,
      scheduledAt: new Date(item.scheduledAt), // Converte string para Date
    }));
  };

  // Estados Mapeados (que os componentes filhos vão usar)
  const mediaItems = useMemo(() => mapDataToMediaItems(initialMediaItems), [initialMediaItems]);
  const scheduleItems = useMemo(() => mapDataToScheduleItems(initialScheduleItems), [initialScheduleItems]);
  
  // 'counts' e 'filteredMediaItems' foram REMOVIDOS daqui


  // --- Funções de Ação (Handlers) ---
  const handleDataChanged = useCallback(() => {
    // Esta função agora é chamada pelo 'MyLists' ou 'MediaSearch'
    setCalendarKey(prevKey => prevKey + 1); 
    fetchSharedData(); // Re-busca apenas os dados compartilhados
  }, [fetchSharedData]); 

  // Handlers de Agendamento (permanecem, pois o estado 'scheduleItems' é local)
  const handleAddSchedule = (newSchedule: MappedScheduleItem) => {
    // @ts-ignore
    setInitialScheduleItems((prev) => [...prev, newSchedule]);
    handleDataChanged();
  };

  const handleRemoveSchedule = (id: string) => {
    setInitialScheduleItems((prev) => prev.filter((item) => item.id !== id));
    handleDataChanged();
  };

  const handleCompleteSchedule = (id: string) => {
    setInitialScheduleItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isCompleted: true } : item
      )
    );
    handleDataChanged(); 
  };

  // --- [INÍCIO DA MUDANÇA 3] ---
  // As funções 'handleUpdateStatus', 'handleRemoveItem', e 'handleToggleWeekly'
  // foram REMOVIDAS daqui, pois agora vivem dentro do 'MyLists.tsx'
  // --- [FIM DA MUDANÇA 3] ---


  // --- (Lógica do Avatar/Cropper) ---
  const handleAvatarClick = () => { fileInputRef.current?.click(); };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); 
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) { setActionError("Ficheiro inválido."); return; }
      if (file.size > 5 * 1024 * 1024) { setActionError("Imagem muito grande (Max 5MB)."); return; }
      setImageSrc(URL.createObjectURL(file)); 
      setIsCropperOpen(true); 
      setActionError(null);
      setSettingsMessage("");
    }
  };
  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    if (avatarAspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, avatarAspect));
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
    if (!ctx) { throw new Error('Não foi possível obter o contexto 2D'); }
    ctx.drawImage(
      image,
      completedCrop.x * scaleX, completedCrop.y * scaleY,
      completedCrop.width * scaleX, completedCrop.height * scaleY,
      0, 0, canvas.width, canvas.height
    );
    return new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Falha ao criar blob da imagem cortada')); return; }
        const croppedFile = new File([blob], "avatar.png", { type: "image/png" });
        setSelectedFile(croppedFile);
        setPreviewImage(URL.createObjectURL(croppedFile));
        setIsCropperOpen(false); 
        resolve();
      }, 'image/png');
    });
  };
  const handleAvatarUpload = async (): Promise<string> => {
    if (!selectedFile) { throw new Error("Nenhum ficheiro selecionado."); }
    setSettingsMessage("A fazer upload do avatar...");
    const formData = new FormData();
    formData.append("file", selectedFile); 
    formData.append("type", "avatar"); // Envia o tipo
    const res = await fetch('/api/profile/upload', { method: 'POST', body: formData });
    const { url: newImageUrl, error } = await res.json();
    if (!res.ok) { throw new Error(error || "Falha no upload"); }
    return newImageUrl; 
  };
  // --- [FIM] ---


  // --- (Lógica do Banner/Cropper) ---
  const handleBannerClick = () => {
    bannerFileInputRef.current?.click();
  };
  const handleBannerFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBannerCrop(undefined); 
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) { setActionError("Ficheiro inválido."); return; }
      if (file.size > 5 * 1024 * 1024) { setActionError("Imagem muito grande (Max 5MB)."); return; }
      setBannerImageSrc(URL.createObjectURL(file)); 
      setIsBannerCropperOpen(true); 
      setActionError(null);
      setSettingsMessage("");
    }
  };
  function onBannerImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    if (bannerAspect) {
      const { width, height } = e.currentTarget;
      setBannerCrop(centerAspectCrop(width, height, bannerAspect));
    }
  }
  const handleBannerCropConfirm = async () => {
    const image = bannerImgRef.current;
    const canvas = canvasRef.current; // Reutilizamos o canvas
    if (!image || !canvas || !completedBannerCrop) {
      throw new Error('Recursos de corte não estão prontos');
    }
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedBannerCrop.width * scaleX;
    canvas.height = completedBannerCrop.height * scaleY;
    const ctx = canvas.getContext('2d');
    if (!ctx) { throw new Error('Não foi possível obter o contexto 2D'); }
    ctx.drawImage(
      image,
      completedBannerCrop.x * scaleX, completedBannerCrop.y * scaleY,
      completedBannerCrop.width * scaleX, completedBannerCrop.height * scaleY,
      0, 0, canvas.width, canvas.height
    );
    return new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Falha ao criar blob do banner')); return; }
        const croppedFile = new File([blob], "banner.png", { type: "image/png" });
        setSelectedBannerFile(croppedFile);
        setPreviewBanner(URL.createObjectURL(croppedFile));
        setIsBannerCropperOpen(false); 
        resolve();
      }, 'image/png');
    });
  };
  const handleBannerUpload = async (): Promise<string> => {
    if (!selectedBannerFile) { throw new Error("Nenhum ficheiro de banner selecionado."); }
    setSettingsMessage("A fazer upload do banner...");
    const formData = new FormData();
    formData.append("file", selectedBannerFile); 
    formData.append("type", "banner"); // Envia o tipo
    const res = await fetch('/api/profile/upload', { method: 'POST', body: formData });
    const { url: newBannerUrl, error } = await res.json();
    if (!res.ok) { throw new Error(error || "Falha no upload do banner"); }
    return newBannerUrl; 
  };
  // --- [FIM] ---

  
   // --- handleSaveSettings (Atualizado para Banner) ---
   const handleSaveSettings = async () => {
     if (!isCreator) return;
     
     setIsSavingSettings(true); 
     setSettingsMessage("A guardar..."); 
     setActionError(null);

     // @ts-ignore
     let newImageUrl = session?.user?.image || null;
     // @ts-ignore
     let newBannerUrl = session?.user?.profileBannerUrl || null;

     try {
       // Etapa 1: Fazer Upload do Avatar (se mudou)
       if (selectedFile) {
         setSettingsMessage("A fazer upload do avatar...");
         newImageUrl = await handleAvatarUpload(); 
         setSettingsMessage("Upload concluído, a guardar definições...");
       }

       // Etapa 2: Fazer Upload do Banner (se mudou)
       if (selectedBannerFile) {
         setSettingsMessage("A fazer upload do banner...");
         newBannerUrl = await handleBannerUpload();
         setSettingsMessage("Uploads concluídos, a guardar definições...");
       }

       // Etapa 3: Guardar Definições
       const payload = { 
         name: displayName,
         bio: bio,
         profileVisibility: profileVisibility,
         showToWatchList: showToWatch,
         showWatchingList: showWatching,
         showWatchedList: showWatched,
         showDroppedList: showDropped,
         image: newImageUrl, 
         profileBannerUrl: newBannerUrl,
       };
       
       const res = await fetch('/api/profile/settings', {
         method: 'PUT', headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload),
       });
       
       if (!res.ok) { 
         const d = await res.json(); 
         throw new Error(d.error || 'Falha ao guardar definições.'); 
       }
       
       const newSettings = await res.json(); 

       // Etapa 4: Atualizar a Sessão
       if (updateSession) {
         await updateSession({
           ...session, 
           user: {
             ...session?.user, 
             name: newSettings.name,
             image: newSettings.image, 
             bio: newSettings.bio,
             profileVisibility: newSettings.profileVisibility,
             showToWatchList: newSettings.showToWatchList,
             showWatchingList: newSettings.showWatchingList,
             showWatchedList: newSettings.showWatchedList,
             showDroppedList: newSettings.showDroppedList,
             profileBannerUrl: newSettings.profileBannerUrl,
           }
         });
       }

       // Etapa 5: Feedback
       setSettingsMessage("Guardado!");
       setSelectedFile(null); 
       setSelectedBannerFile(null);
       
     } catch (error: any) {
       console.error("Erro ao guardar definições:", error);
       setSettingsMessage(""); 
       setActionError(`Erro: ${error.message}`);
       
       if (selectedFile) {
         setPreviewImage(session?.user?.image || null);
       }
       if (selectedBannerFile) {
         // @ts-ignore
         setPreviewBanner(session?.user?.profileBannerUrl || null);
       }
     } finally {
       setIsSavingSettings(false);
       if (fileInputRef.current) {
         fileInputRef.current.value = "";
       }
       if (bannerFileInputRef.current) {
         bannerFileInputRef.current.value = "";
       }
     }
   };
  // --- [FIM] ---

  // --- Estados de Carregamento ---
  // @ts-ignore
  const firstName = (displayName || session?.user?.name)?.split(' ')[0] || session?.user?.username || "";
  const fallbackLetter = (session?.user?.name || session?.user?.username || "U").charAt(0).toUpperCase();

  if (isLoading || (status === "authenticated" && isLoading)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
        <p className="text-muted-foreground">A carregar o seu dashboard...</p>
      </div>
    );
  }
  // --- Fim dos Estados de Carregamento ---

  
  // --- [INÍCIO DO JSX (Layout Sidebar + 3 Abas)] ---
  return (
    <>
      <AppTour
        run={runTour}
        steps={tourSteps}
        callback={handleJoyrideCallback}
      />
      
      <canvas
        ref={canvasRef}
        style={{ display: 'none', objectFit: 'contain' }}
      />

      {/* --- Diálogo de Corte do Avatar --- */}
      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cortar Avatar (1:1)</DialogTitle>
          </DialogHeader>
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={avatarAspect}
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
      
      {/* --- Diálogo de Corte do Banner --- */}
      <Dialog open={isBannerCropperOpen} onOpenChange={setIsBannerCropperOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cortar Banner (16:9)</DialogTitle>
          </DialogHeader>
          {bannerImageSrc && (
            <ReactCrop
              crop={bannerCrop}
              onChange={(_, percentCrop) => setBannerCrop(percentCrop)}
              onComplete={(c) => setCompletedBannerCrop(c)}
              aspect={bannerAspect} 
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={bannerImgRef}
                alt="Banner para cortar"
                src={bannerImageSrc}
                onLoad={onBannerImageLoad}
                style={{ maxHeight: '70vh', width: '100%' }}
              />
            </ReactCrop>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleBannerCropConfirm}>Confirmar Corte</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Contêiner principal */}
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 md:py-12">
          
          {/* Saudação */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Olá, {firstName}!
              </h1>
              <p className="text-lg text-muted-foreground">
                Gestão do seu cronograma e perfil.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleStartTourClick}
            >
              Reiniciar Tour
            </Button>
          </div>

          {/* Alertas de Ação */}
          {isUpdating && ( <div className="fixed top-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse"> A atualizar... </div> )}
          {actionError && ( 
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
           )}

          {/* Grid de 2 Colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Coluna da Esquerda (Sidebar de Configurações) */}
            <aside className="lg:col-span-1 space-y-6">
              {isCreator ? (
                <Card id="tour-step-1-perfil" className="shadow-lg border-2">
                    <CardHeader>
                        <CardTitle>Personalizar Perfil</CardTitle>
                        <CardDescription>Ajuste a sua página pública.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                        {/* UI do Avatar */}
                        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
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
                            className="relative group rounded-full flex-shrink-0"
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
                          <div className="w-full space-y-2 text-center sm:text-left">
                            <p className="text-sm text-muted-foreground">Clique no avatar para alterar a imagem.</p>
                            {selectedFile && (
                              <p className="text-sm text-blue-600 font-medium">Novo avatar pronto.</p>
                            )}
                          </div>
                        </div>

                        {/* UI do Banner */}
                        <div className="space-y-2">
                          <Label>Banner do Perfil (16:9)</Label>
                          <input
                            type="file"
                            ref={bannerFileInputRef}
                            onChange={handleBannerFileChange} 
                            accept="image/png, image/jpeg, image/gif"
                            className="hidden" 
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full" 
                            onClick={handleBannerClick}
                            disabled={isSavingSettings}
                          >
                            <Pen className="h-4 w-4 mr-2" />
                            Alterar Imagem do Banner
                          </Button>
                          {previewBanner && (
                            <div className="mt-2 text-center">
                              <p className="text-sm text-muted-foreground mb-2">Pré-visualização:</p>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <Image 
                                src={previewBanner} 
                                alt="Preview do Banner" 
                                width={1600} 
                                height={900} 
                                className="rounded-md aspect-video object-cover border"
                              />
                            </div>
                          )}
                          {selectedBannerFile && (
                              <p className="text-sm text-blue-600 font-medium">Novo banner pronto.</p>
                          )}
                        </div>
                        
                        {/* Nome de Exibição */}
                        <div className="space-y-1">
                            <Label htmlFor="profile-name" className="text-sm font-medium text-foreground">Nome de Exibição</Label>
                            <Input 
                              id="profile-name" 
                              value={displayName} 
                              onChange={(e) => setDisplayName(e.target.value)} 
                              placeholder="O seu nome público" 
                              maxLength={50} 
                              className="placeholder:text-muted-foreground" 
                              disabled={isSavingSettings} 
                            />
                            <p className="text-xs text-muted-foreground">Seu @ é: {session?.user?.username} (não pode ser alterado)</p>
                        </div>
                        
                        {/* Bio */}
                        <div className="space-y-1">
                            <Label htmlFor="profile-bio" className="text-sm font-medium text-foreground">Bio Curta</Label>
                            <Textarea id="profile-bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Fale um pouco sobre si..." maxLength={200} className="h-24 placeholder:text-muted-foreground" disabled={isSavingSettings} />
                             <p className="text-xs text-muted-foreground text-right">{200 - (bio?.length || 0)} caracteres restantes</p>
                        </div>
                        
                        {/* Status da Live (Twitch) */}
                        <div className="space-y-2 pt-2">
                          <Label className="text-sm font-medium text-foreground">Status da Live (Twitch)</Label>
                          {session?.user?.twitchUsername ? (
                            <div className="flex items-center justify-between gap-2 rounded-md border border-input bg-background p-3">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6441a5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitch flex-shrink-0"><path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7"/></svg>
                                <span className="text-sm font-medium text-foreground truncate" title={session.user.twitchUsername}>
                                  {/* @ts-ignore */}
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

                        {/* Switches de Visibilidade */}
                        <div className="space-y-2 pt-2">
                          <Label className="text-sm font-medium text-foreground">Visibilidade das Listas</Label>
                          <p className="text-xs text-muted-foreground">Escolha quais listas são visíveis na sua página pública.</p>
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between rounded-md border p-3">
                              <Label htmlFor="showToWatch" className="text-sm font-medium cursor-pointer">Próximo Conteúdo</Label>
                              <Switch id="showToWatch" checked={showToWatch} onCheckedChange={setShowToWatch} disabled={isSavingSettings} />
                            </div>
                            <div className="flex items-center justify-between rounded-md border p-3">
                              <Label htmlFor="showWatching" className="text-sm font-medium cursor-pointer">Essa Semana</Label>
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

                        {/* Botão de Guardar */}
                        <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full mt-2">
                           {isSavingSettings ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                           Guardar Definições
                        </Button>
                        {settingsMessage && (
                          <Alert variant={actionError ? "destructive" : "default"} className={!actionError ? "bg-green-50 border-green-200" : ""}>
                            <AlertDescription className={!actionError ? "text-green-800" : ""}>
                              {settingsMessage}
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                  </Card>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">As definições de perfil estão disponíveis apenas para Criadores.</p>
                  </CardContent>
                </Card>
              )}
            </aside>
            {/* --- FIM DA SIDEBAR --- */}


            {/* Coluna da Direita (Conteúdo Principal com 3 Abas) */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="listas">
                <TabsList className="grid w-full grid-cols-3 md:max-w-xl mb-4">
                  <TabsTrigger value="listas"> <List className="h-4 w-4 mr-2" /> Minhas Listas </TabsTrigger>
                  <TabsTrigger value="agenda"> <CalendarDays className="h-4 w-4 mr-2" /> Gerir Agenda </TabsTrigger>
                  <TabsTrigger value="calendario"> <Calendar className="h-4 w-4 mr-2" /> Calendário </TabsTrigger>
                </TabsList>

                {/* --- [INÍCIO DA MUDANÇA 4] --- */}
                {/* Aba 1: Listas e Busca */}
                <TabsContent value="listas" className="mt-6 space-y-6" id="tour-step-2-listas-busca">
                  <MediaSearch onMediaAdded={handleDataChanged} />
                  {/* 'MyLists' agora só precisa de 'onDataChanged' */}
                  <MyLists onDataChanged={handleDataChanged} />
                </TabsContent>

                {/* Aba 2: Agenda */}
                <TabsContent value="agenda" className="mt-6" id="tour-step-3-agenda">
                  <ScheduleManager
                    mediaItems={mediaItems} // Passa apenas a lista 'WATCHING'
                    scheduleItems={scheduleItems}
                    onAddSchedule={handleAddSchedule}
                    onRemoveSchedule={handleRemoveSchedule}
                    onCompleteSchedule={handleCompleteSchedule}
                  />
                </TabsContent>

                {/* Aba 3: Calendário */}
                <TabsContent value="calendario" className="mt-6" id="tour-step-4-calendario">
                  <FullCalendar
                    key={calendarKey} 
                    scheduleItems={scheduleItems}
                    // 'mediaItems' foi removido
                  />
                </TabsContent>
                {/* --- [FIM DA MUDANÇA 4] --- */}
              </Tabs>
            </div>
            {/* --- FIM DO CONTEÚDO PRINCIPAL --- */}

          </div> 
        </main>
      </div>
    </>
  );
}