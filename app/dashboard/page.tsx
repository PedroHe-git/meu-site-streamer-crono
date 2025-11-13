// app/dashboard/page.tsx
"use client";

// 1. Importações de Hooks e Tipos
import { 
  useState, useEffect, useCallback, useMemo, useRef, 
  ChangeEvent, SyntheticEvent 
} from "react";
// @ts-ignore
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
import StatsTab from "@/app/components/Statistic";

// 4. Importações de UI (shadcn)
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"; 
import AppTour from '@/app/components/AppTour'; 
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
import { Pen, Settings, List, CalendarDays, Calendar, Loader2, Check, BarChart } from "lucide-react"; 
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

// --- Tipos ---
type MediaStatusWithMedia = MediaStatus & { media: Media; };
type ScheduleItemWithMedia = ScheduleItem & { media: Media; };
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";
type MediaType = "MOVIE" | "SERIES" | "ANIME" | "OUTROS"; 

type MappedMediaItem = {
  id: string; 
  userId: string; 
  mediaId: string; 
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
  media: Media; 
};

type MappedScheduleItem = ScheduleItemWithMedia & {
  scheduledAt: Date;
};

// --- Passos do Tour ---
const STEP_PERFIL: Step = { target: '#tour-step-1-perfil', content: 'Bem-vindo! Aqui pode personalizar a sua página com um avatar, bio e definir a sua privacidade.', placement: 'right', };
const STEP_LISTAS: Step = { target: '#tour-step-2-listas-busca', content: 'Este é o seu painel principal. Pesquise filmes, animes, séries ou adicione manualmente, e organize-as em listas: "Próximo Conteúdo", "Essa Semana".', placement: 'top', };
const STEP_LISTAS_PARA_ASSISTIR: Step = { target: '#tour-step-lista-para-assistir', content: 'Essa lista é para os filmes que você pretende assistir, mas ainda não definiu uma data.', placement: 'top', } as Step;
const STEP_LISTAS_PARA_ASSISINDO: Step = { target: '#tour-step-lista-assistindo', content: 'Aqui ficam os itens que já têm uma data prevista — prontos para você agendar quando quiser.', placement: 'top', } as Step;
const STEP_LISTAS_PARA_JA_ASSISTIDO: Step = { target: '#tour-step-lista-ja-assistido', content: 'Essa lista armazena os itens já assistidos, mantendo o histórico atualizado.', placement: 'top', } as Step;
const STEP_LISTAS_PARA_ABANDONADOS: Step = { target: '#tour-step-lista-abandonados', content: 'Essa lista armazena os itens que foram interrompidos ou não tiveram continuidade.', placement: 'top', } as Step;
const STEP_AGENDA: Step = { target: '#tour-step-3-agenda', content: 'Organize seus episódios com o Gerir Agendamento! Escolha o item, defina a data e o horário (se quiser) e pronto!', placement: 'top', } as Step;
const STEP_LISTA_PROX_AGENDA: Step = { target: '#tour-step-lista-agendamentos', content: 'Gerencie seus itens agendados. Ao assistir clique em CONCLUÍDO ou VISTO! Caso não conseguiu ver clique em REMOVER', placement: 'top', } as Step;
const STEP_CALENDARIO: Step = { target: '#tour-step-4-calendario', content: 'Aqui tem uma visão completa do seu cronograma, mostrando todos os seus agendamentos passados e futuros.', placement: 'top', } as Step;

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight), mediaWidth, mediaHeight);
}

export default function DashboardPage() {
  const { data: session, status, update: updateSession } = useSession();

  // Estados de Dados
  const [initialMediaItems, setInitialMediaItems] = useState<MediaStatusWithMedia[]>([]); 
  const [initialScheduleItems, setInitialScheduleItems] = useState<ScheduleItemWithMedia[]>([]);
  
  // Estados de UI
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dataVersionKey, setDataVersionKey] = useState(0);

  // Estados de Perfil
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

  // Estados do Cropper (Avatar)
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

  // Estados do Cropper (Banner)
  const [previewBanner, setPreviewBanner] = useState<string | null>(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const bannerImgRef = useRef<HTMLImageElement>(null);
  const [bannerImageSrc, setBannerImageSrc] = useState('');
  const [bannerCrop, setBannerCrop] = useState<Crop>();
  const [completedBannerCrop, setCompletedBannerCrop] = useState<PixelCrop>();
  const [isBannerCropperOpen, setIsBannerCropperOpen] = useState(false);
  const bannerAspect = 16 / 9;

  // Lógica do Tour
  const [runTour, setRunTour] = useState(false);
  const tourSteps = useMemo(() => {
    const dynamicSteps: Step[] = [];
    if (isCreator) dynamicSteps.push(STEP_PERFIL);
    dynamicSteps.push(STEP_LISTAS, STEP_LISTAS_PARA_ASSISTIR, STEP_LISTAS_PARA_ASSISINDO, STEP_LISTAS_PARA_JA_ASSISTIDO, STEP_LISTAS_PARA_ABANDONADOS, STEP_AGENDA, STEP_LISTA_PROX_AGENDA, STEP_CALENDARIO);
    return dynamicSteps;
  }, [isCreator]);

  useEffect(() => {
    if (status !== 'loading' && !isLoading) {
      const hasViewedTour = localStorage.getItem('meuCronogramaTourV1');
      if (!hasViewedTour) setTimeout(() => { setRunTour(true); }, 500); 
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

  // Carrega dados da sessão
  useEffect(() => {
    if (session?.user) {
      setDisplayName(session.user.name || "");
      // @ts-ignore
      setBio(session.user.bio || "");
      // @ts-ignore
      setProfileVisibility(session.user.profileVisibility || "PUBLIC");
      if (!selectedFile) setPreviewImage(session.user.image || null);
      // @ts-ignore
      if (!selectedBannerFile) setPreviewBanner(session.user.profileBannerUrl || null);
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
  
  // Busca de Dados
  const fetchSharedData = useCallback(async () => {
    setIsUpdating(true);
    try {
      const resWatching = await fetch(`/api/mediastatus?status=WATCHING&page=1&pageSize=50&searchTerm=`);
      if (!resWatching.ok) throw new Error(`Falha ao buscar a lista WATCHING`);
      const watchingData = await resWatching.json();
      setInitialMediaItems(watchingData.items); 

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
  }, []);

  // Efeito de Carga Inicial
  useEffect(() => {
    if (status === "authenticated") {
      fetchSharedData();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
      if (typeof window !== 'undefined') { redirect("/auth/signin"); } 
    }
  }, [status, fetchSharedData]);

  
  // Mapeamento de Dados
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
    return dataItems.map((item) => ({ ...item, scheduledAt: new Date(item.scheduledAt) }));
  };
  const mediaItems = useMemo(() => mapDataToMediaItems(initialMediaItems), [initialMediaItems]);
  const scheduleItems = useMemo(() => mapDataToScheduleItems(initialScheduleItems), [initialScheduleItems]);

  // Handlers de Ação
  const handleDataChanged = useCallback(() => {
    setDataVersionKey(prevKey => prevKey + 1); 
    fetchSharedData(); 
  }, [fetchSharedData]); 

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
    setInitialScheduleItems((prev) => prev.map((item) => (item.id === id ? { ...item, isCompleted: true } : item)));
    handleDataChanged(); 
  };

  // Funções de Cropper (Avatar)
  const handleAvatarClick = () => { fileInputRef.current?.click(); };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) { setCrop(undefined); const file = e.target.files[0]; if (!file.type.startsWith("image/")) { setActionError("Ficheiro inválido."); return; } if (file.size > 5 * 1024 * 1024) { setActionError("Imagem muito grande (Max 5MB)."); return; } setImageSrc(URL.createObjectURL(file)); setIsCropperOpen(true); setActionError(null); setSettingsMessage(""); } };
  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) { if (avatarAspect) { const { width, height } = e.currentTarget; setCrop(centerAspectCrop(width, height, avatarAspect)); } }
  const handleCropConfirm = async () => { const image = imgRef.current; const canvas = canvasRef.current; if (!image || !canvas || !completedCrop) { throw new Error('Recursos de corte não estão prontos'); } const scaleX = image.naturalWidth / image.width; const scaleY = image.naturalHeight / image.height; canvas.width = completedCrop.width * scaleX; canvas.height = completedCrop.height * scaleY; const ctx = canvas.getContext('2d'); if (!ctx) { throw new Error('Não foi possível obter o contexto 2D'); } ctx.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, canvas.width, canvas.height); return new Promise<void>((resolve, reject) => { canvas.toBlob((blob) => { if (!blob) { reject(new Error('Falha ao criar blob da imagem cortada')); return; } const croppedFile = new File([blob], "avatar.png", { type: "image/png" }); setSelectedFile(croppedFile); setPreviewImage(URL.createObjectURL(croppedFile)); setIsCropperOpen(false); resolve(); }, 'image/png'); }); };
  const handleAvatarUpload = async (): Promise<string> => { if (!selectedFile) { throw new Error("Nenhum ficheiro selecionado."); } setSettingsMessage("A fazer upload do avatar..."); const formData = new FormData(); formData.append("file", selectedFile); formData.append("type", "avatar"); const res = await fetch('/api/profile/upload', { method: 'POST', body: formData }); const { url: newImageUrl, error } = await res.json(); if (!res.ok) { throw new Error(error || "Falha no upload"); } return newImageUrl; };
  
  // Funções de Cropper (Banner)
  const handleBannerClick = () => { bannerFileInputRef.current?.click(); };
  const handleBannerFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) { setBannerCrop(undefined); const file = e.target.files[0]; if (!file.type.startsWith("image/")) { setActionError("Ficheiro inválido."); return; } if (file.size > 5 * 1024 * 1024) { setActionError("Imagem muito grande (Max 5MB)."); return; } setBannerImageSrc(URL.createObjectURL(file)); setIsBannerCropperOpen(true); setActionError(null); setSettingsMessage(""); } };
  function onBannerImageLoad(e: SyntheticEvent<HTMLImageElement>) { if (bannerAspect) { const { width, height } = e.currentTarget; setBannerCrop(centerAspectCrop(width, height, bannerAspect)); } }
  const handleBannerCropConfirm = async () => { const image = bannerImgRef.current; const canvas = canvasRef.current; if (!image || !canvas || !completedBannerCrop) { throw new Error('Recursos de corte não estão prontos'); } const scaleX = image.naturalWidth / image.width; const scaleY = image.naturalHeight / image.height; canvas.width = completedBannerCrop.width * scaleX; canvas.height = completedBannerCrop.height * scaleY; const ctx = canvas.getContext('2d'); if (!ctx) { throw new Error('Não foi possível obter o contexto 2D'); } ctx.drawImage(image, completedBannerCrop.x * scaleX, completedBannerCrop.y * scaleY, completedBannerCrop.width * scaleX, completedBannerCrop.height * scaleY, 0, 0, canvas.width, canvas.height); return new Promise<void>((resolve, reject) => { canvas.toBlob((blob) => { if (!blob) { reject(new Error('Falha ao criar blob do banner')); return; } const croppedFile = new File([blob], "banner.png", { type: "image/png" }); setSelectedBannerFile(croppedFile); setPreviewBanner(URL.createObjectURL(croppedFile)); setIsBannerCropperOpen(false); resolve(); }, 'image/png'); }); };
  const handleBannerUpload = async (): Promise<string> => { if (!selectedBannerFile) { throw new Error("Nenhum ficheiro de banner selecionado."); } setSettingsMessage("A fazer upload do banner..."); const formData = new FormData(); formData.append("file", selectedBannerFile); formData.append("type", "banner"); const res = await fetch('/api/profile/upload', { method: 'POST', body: formData }); const { url: newBannerUrl, error } = await res.json(); if (!res.ok) { throw new Error(error || "Falha no upload do banner"); } return newBannerUrl; };
  
   // Handler de Salvar Configurações
   const handleSaveSettings = async () => {
     if (!isCreator) return;
     setIsSavingSettings(true); setSettingsMessage("A guardar..."); setActionError(null);
     // @ts-ignore
     let newImageUrl = session?.user?.image || null;
     // @ts-ignore
     let newBannerUrl = session?.user?.profileBannerUrl || null;
     try {
       if (selectedFile) { setSettingsMessage("A fazer upload do avatar..."); newImageUrl = await handleAvatarUpload(); setSettingsMessage("Upload concluído..."); }
       if (selectedBannerFile) { setSettingsMessage("A fazer upload do banner..."); newBannerUrl = await handleBannerUpload(); setSettingsMessage("Uploads concluídos..."); }
       const payload = { name: displayName, bio: bio, profileVisibility: profileVisibility, showToWatchList: showToWatch, showWatchingList: showWatching, showWatchedList: showWatched, showDroppedList: showDropped, image: newImageUrl, profileBannerUrl: newBannerUrl, };
       const res = await fetch('/api/profile/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), });
       if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Falha ao guardar definições.'); }
       const newSettings = await res.json(); 
       if (updateSession) { await updateSession({ ...session, user: { ...session?.user, name: newSettings.name, image: newSettings.image, bio: newSettings.bio, profileVisibility: newSettings.profileVisibility, showToWatchList: newSettings.showToWatchList, showWatchingList: newSettings.showWatchingList, showWatchedList: newSettings.showWatchedList, showDroppedList: newSettings.showDroppedList, profileBannerUrl: newSettings.profileBannerUrl, } }); }
       setSettingsMessage("Guardado!"); setSelectedFile(null); setSelectedBannerFile(null);
     } catch (error: any) { console.error("Erro ao guardar definições:", error); setSettingsMessage(""); setActionError(`Erro: ${error.message}`); if (selectedFile) { setPreviewImage(session?.user?.image || null); } if (selectedBannerFile) { /* @ts-ignore */ setPreviewBanner(session?.user?.profileBannerUrl || null); }
     } finally { setIsSavingSettings(false); if (fileInputRef.current) fileInputRef.current.value = ""; if (bannerFileInputRef.current) bannerFileInputRef.current.value = ""; }
   };

  // --- Renderização ---
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
  
  return (
    <>
      <AppTour run={runTour} steps={tourSteps} callback={handleJoyrideCallback} />
      <canvas ref={canvasRef} style={{ display: 'none', objectFit: 'contain' }} />

      {/* --- Diálogos de Corte --- */}
      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <DialogContent className="max-w-md"> <DialogHeader><DialogTitle>Cortar Avatar (1:1)</DialogTitle></DialogHeader> {imageSrc && ( <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={avatarAspect} circularCrop > <img ref={imgRef} alt="Cortar" src={imageSrc} onLoad={onImageLoad} style={{ maxHeight: '70vh' }} /> </ReactCrop> )} <DialogFooter> <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose> <Button onClick={handleCropConfirm}>Confirmar</Button> </DialogFooter> </DialogContent>
      </Dialog>
      <Dialog open={isBannerCropperOpen} onOpenChange={setIsBannerCropperOpen}>
        <DialogContent className="max-w-2xl"> <DialogHeader><DialogTitle>Cortar Banner (16:9)</DialogTitle></DialogHeader> {bannerImageSrc && ( <ReactCrop crop={bannerCrop} onChange={(_, percentCrop) => setBannerCrop(percentCrop)} onComplete={(c) => setCompletedBannerCrop(c)} aspect={bannerAspect} > <img ref={bannerImgRef} alt="Cortar" src={bannerImageSrc} onLoad={onBannerImageLoad} style={{ maxHeight: '70vh', width: '100%' }} /> </ReactCrop> )} <DialogFooter> <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose> <Button onClick={handleBannerCropConfirm}>Confirmar</Button> </DialogFooter> </DialogContent>
      </Dialog>
      
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 md:py-12">
          
          {/* Saudação */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Olá, {firstName}!</h1>
              <p className="text-lg text-muted-foreground">Gestão do seu cronograma e perfil.</p>
            </div>
            <Button variant="outline" onClick={handleStartTourClick}>Reiniciar Tour</Button>
          </div>

          {isUpdating && ( <div className="fixed top-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse"> A atualizar... </div> )}
          {actionError && ( <Alert variant="destructive" className="mb-4"> <AlertDescription>{actionError}</AlertDescription> </Alert> )}

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
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" className="hidden" />
                          <button type="button" onClick={handleAvatarClick} className="relative group rounded-full flex-shrink-0" title="Alterar avatar" disabled={isSavingSettings}>
                            <Avatar className="h-24 w-24 border-2 border-muted">
                              <AvatarImage src={previewImage || undefined} alt={session?.user?.username || "Avatar"} />
                              <AvatarFallback className="text-3xl">{fallbackLetter}</AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"> <Pen className="h-6 w-6 text-white" /> </div>
                          </button>
                          <div className="w-full space-y-2 text-center sm:text-left">
                            <p className="text-sm text-muted-foreground">Clique no avatar para alterar a imagem.</p>
                            {selectedFile && ( <p className="text-sm text-blue-600 font-medium">Novo avatar pronto.</p> )}
                          </div>
                        </div>

                        {/* UI do Banner */}
                        <div className="space-y-2">
                          <Label>Banner do Perfil (16:9)</Label>
                          <input type="file" ref={bannerFileInputRef} onChange={handleBannerFileChange} accept="image/png, image/jpeg, image/gif" className="hidden" />
                          <Button type="button" variant="outline" className="w-full" onClick={handleBannerClick} disabled={isSavingSettings}>
                            <Pen className="h-4 w-4 mr-2" />
                            Alterar Imagem do Banner
                          </Button>
                          {previewBanner && (
                            <div className="mt-2 text-center">
                              <p className="text-sm text-muted-foreground mb-2">Pré-visualização:</p>
                              <Image src={previewBanner} alt="Preview do Banner" width={1600} height={900} className="rounded-md aspect-video object-cover border" />
                            </div>
                          )}
                          {selectedBannerFile && ( <p className="text-sm text-blue-600 font-medium">Novo banner pronto.</p> )}
                        </div>
                        
                        {/* Nome de Exibição */}
                        <div className="space-y-1">
                            <Label htmlFor="profile-name" className="text-sm font-medium text-foreground">Nome de Exibição</Label>
                            <Input id="profile-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="O seu nome público" maxLength={50} className="placeholder:text-muted-foreground" disabled={isSavingSettings} />
                            <p className="text-xs text-muted-foreground">Seu @ é: {session?.user?.username} (não pode ser alterado)</p>
                        </div>
                        
                        {/* Bio */}
                        <div className="space-y-1">
                            <Label htmlFor="profile-bio" className="text-sm font-medium text-foreground">Bio Curta</Label>
                            <Textarea id="profile-bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Fale um pouco sobre si..." maxLength={200} className="h-24 placeholder:text-muted-foreground" disabled={isSavingSettings} />
                             <p className="text-xs text-muted-foreground text-right">{200 - (bio?.length || 0)} caracteres restantes</p>
                        </div>
                        
                        {/* --- [INÍCIO DO CÓDIGO RESTAURADO] --- */}
                        
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
                        
                        {/* --- [FIM DO CÓDIGO RESTAURADO] --- */}

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
                          <Alert variant={actionError ? "destructive" : "default"} className={!actionError ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700" : ""}>
                            <AlertDescription className={!actionError ? "text-green-800 dark:text-green-300" : ""}>
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


            {/* Coluna da Direita (Conteúdo Principal com Abas) */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="listas">
                {/* --- Correção do Grid para 4 Colunas --- */}
                <TabsList className="grid w-full grid-cols-4 md:max-w-xl mb-4">
                  <TabsTrigger value="listas"> <List className="h-4 w-4 mr-2" /> Minhas Listas </TabsTrigger>
                  <TabsTrigger value="agenda"> <CalendarDays className="h-4 w-4 mr-2" /> Gerir Agenda </TabsTrigger>
                  <TabsTrigger value="calendario"> <Calendar className="h-4 w-4 mr-2" /> Calendário </TabsTrigger>
                  <TabsTrigger value="stats"> <BarChart className="h-4 w-4 mr-2" /> Estatísticas </TabsTrigger>
                </TabsList>

                <TabsContent value="listas" className="mt-6 space-y-6" id="tour-step-2-listas-busca">
                  <MediaSearch onMediaAdded={handleDataChanged} />
                  {/* Passa o dataVersionKey para o MyLists */}
                  <MyLists 
                    onDataChanged={handleDataChanged} 
                    dataVersionKey={dataVersionKey} 
                  />
                </TabsContent>

                <TabsContent value="agenda" className="mt-6" id="tour-step-3-agenda">
                  <ScheduleManager
                    mediaItems={mediaItems} 
                    scheduleItems={scheduleItems}
                    onAddSchedule={handleAddSchedule}
                    onRemoveSchedule={handleRemoveSchedule}
                    onCompleteSchedule={handleCompleteSchedule}
                  />
                </TabsContent>

                <TabsContent value="calendario" className="mt-6" id="tour-step-4-calendario">
                  <FullCalendar
                    key={dataVersionKey} // Usa a key para forçar atualização
                    scheduleItems={scheduleItems}
                  />
                </TabsContent>

                {/* --- Correção: Envolve o StatsTab com TabsContent --- */}
                <TabsContent value="stats">
                  <StatsTab />
                </TabsContent>

              </Tabs>
            </div>
            {/* --- FIM DO CONTEÚDO PRINCIPAL --- */}

          </div> 
        </main>
      </div>
    </>
  );
}