"use client";

import {
  useState, useEffect, useCallback, useMemo, useRef,
  ChangeEvent, SyntheticEvent
} from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Media, MediaStatus, ScheduleItem, UserRole, ProfileVisibility, MediaType } from "@prisma/client";
import Image from "next/image"; 
import { Input } from "@/components/ui/input";


import ReactCrop, {
  type Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import MediaSearch from "./MediaSearch";
import MyLists from "./MyLists";
import ScheduleManager from "./ScheduleManager";
import FullCalendar from "./FullCalendar";
import StatsTab from "@/app/components/Statistic";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pen, Settings, List, CalendarDays, Calendar, Loader2, Check, BarChart, Share2, Tv, Upload, Eye, Handshake, Gift } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// --- Tipos ---
type MediaStatusWithMedia = MediaStatus & { media: Media; };
type ScheduleItemWithMedia = ScheduleItem & { media: Media; };
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";

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

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight), mediaWidth, mediaHeight);
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();
  const { toast } = useToast();

  const [manualImageFile, setManualImageFile] = useState<File | null>(null);
  const [isUploadingManual, setIsUploadingManual] = useState(false);

  // Links e Integrações
  const [ytMain, setYtMain] = useState("");
  const [ytSecond, setYtSecond] = useState("");
  const [ytThird, setYtThird] = useState("");
  const [ytFourth, setYtFourth] = useState("");
  const [amazonLink, setAmazonLink] = useState("");

  // Estados de Dados
  const [initialMediaItems, setInitialMediaItems] = useState<MediaStatusWithMedia[]>([]);
  const [initialScheduleItems, setInitialScheduleItems] = useState<ScheduleItemWithMedia[]>([]);

  // Estados de UI
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dataVersionKey, setDataVersionKey] = useState(0);

  // Estados de Perfil (Modal de Edição)
  const userRole = session?.user?.role as UserRole | undefined;
  const isCreator = userRole === UserRole.CREATOR;
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [twitchLink, setTwitchLink] = useState("");
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>("PUBLIC");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [showToWatch, setShowToWatch] = useState(true);
  const [showWatching, setShowWatching] = useState(true);
  const [showWatched, setShowWatched] = useState(true);
  const [showDropped, setShowDropped] = useState(true);

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

  // Stats
  const [statFollowers, setStatFollowers] = useState("");
  const [statMedia, setStatMedia] = useState("");
  const [statRegion, setStatRegion] = useState("");

  // --- MODO HIBERNAÇÃO (ZERO SCALE) ---
  const [isHibernating, setIsHibernating] = useState(false);
  const hibernationTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 10 minutos de inatividade = Hibernação
    const HIBERNATION_TIME = 10 * 60 * 1000; 

    const resetHibernationTimer = () => {
      if (isHibernating) return; // Se já dormiu, só acorda com clique

      if (hibernationTimer.current) clearTimeout(hibernationTimer.current);

      hibernationTimer.current = setTimeout(() => {
        console.log("Inatividade detectada. Entrando em hibernação...");
        setIsHibernating(true);
      }, HIBERNATION_TIME);
    };

    const events = ["mousedown", "keydown", "scroll", "mousemove", "touchstart"];
    
    events.forEach(event => window.addEventListener(event, resetHibernationTimer));
    
    // Inicia o timer
    resetHibernationTimer();

    return () => {
      if (hibernationTimer.current) clearTimeout(hibernationTimer.current);
      events.forEach(event => window.removeEventListener(event, resetHibernationTimer));
    };
  }, [isHibernating]);

  // Carregar dados da Sessão
  useEffect(() => {
    if (session?.user) {
      setDisplayName(session.user.name || "");
      setBio(session.user.bio || "");
      setProfileVisibility(session.user.profileVisibility || "PUBLIC");
      if (!selectedFile) setPreviewImage(session.user.image || null);
      if (!selectedBannerFile) setPreviewBanner(session.user.profileBannerUrl || null);
      
      setShowToWatch(session.user.showToWatchList ?? true);
      setShowWatching(session.user.showWatchingList ?? true);
      setShowWatched(session.user.showWatchedList ?? true);
      setShowDropped(session.user.showDroppedList ?? true);
      
      const userAny = session.user as any;
      setDiscordWebhook(userAny.discordWebhookUrl || "");
      setTwitchLink(userAny.twitchUsername ? `https://twitch.tv/${userAny.twitchUsername}` : "");
      
      setStatFollowers(userAny.statFollowers || "");
      setStatMedia(userAny.statMedia || "");
      setStatRegion(userAny.statRegion || "");
      
      setYtMain(userAny.youtubeMainUrl || "");
      setYtSecond(userAny.youtubeSecondUrl || "");
      setYtThird(userAny.youtubeThirdUrl || "");
      setYtFourth(userAny.youtubeFourthUrl || "");
      setAmazonLink(userAny.amazonWishlistUrl || "");
    }
  }, [session?.user, selectedFile, selectedBannerFile]);

  // Função Principal de Dados (Blindada com Hibernação e Cache)
  const fetchSharedData = useCallback(async () => {
    // 🛑 SE TIVER HIBERNANDO, NÃO FAZ NADA (ZERO SCALE)
    if (isHibernating) return;

    setIsUpdating(true);
    try {
      const [resWatching, resSchedule] = await Promise.all([
        fetch(`/api/mediastatus?status=WATCHING&page=1&pageSize=50&searchTerm=`, { cache: 'no-store' }),
        fetch(`/api/schedule?list=pending`, { cache: 'no-store' })
      ]);
      
      if (resWatching.ok) {
        const watchingData = await resWatching.json();
        setInitialMediaItems(watchingData.items || []);
      } else {
        setInitialMediaItems([]);
      }

      if (resSchedule.ok) {
        const scheduleData = await resSchedule.json();
        setInitialScheduleItems(Array.isArray(scheduleData) ? scheduleData : []);
      } else {
        setInitialScheduleItems([]);
      }

    } catch (error) {
      console.error("Erro crítico ao buscar dados:", error);
      setActionError("Falha ao carregar dados do dashboard.");
      setInitialMediaItems([]);
      setInitialScheduleItems([]);
    } finally {
      setIsUpdating(false);
      setIsLoading(false);
    }
  }, [isHibernating]); // 👈 AVISO CORRIGIDO: Dependência apenas do isHibernating

  // Efeito para disparar a busca (Monitora Auth e DataVersion)
  useEffect(() => {
    if (status === "authenticated") {
        fetchSharedData();
    } else if (status === "unauthenticated") { 
        setIsLoading(false); 
        if (typeof window !== 'undefined') redirect("/auth/signin"); 
    }
  }, [status, fetchSharedData, dataVersionKey]); // 👈 dataVersionKey fica AQUI para disparar o refresh

  // --- FUNÇÕES DE MAPEAMENTO ---
  const mapDataToMediaItems = (dataItems: MediaStatusWithMedia[]): MappedMediaItem[] => {
    if (!dataItems || !Array.isArray(dataItems)) return [];
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
      media: item.media,
      episodes: 0,
      seasons: 0,
    }));
  };

  const mapDataToScheduleItems = (dataItems: ScheduleItemWithMedia[]): MappedScheduleItem[] => {
    if (!dataItems || !Array.isArray(dataItems)) return [];
    return dataItems.map((item) => ({ ...item, scheduledAt: new Date(item.scheduledAt) }));
  };

  const mediaItems = useMemo(() => mapDataToMediaItems(initialMediaItems), [initialMediaItems]);
  const scheduleItems = useMemo(() => mapDataToScheduleItems(initialScheduleItems), [initialScheduleItems]);
  
  const handleDataChanged = useCallback(() => { setDataVersionKey(prevKey => prevKey + 1); }, []);
  
  const handleAddSchedule = (newSchedule: MappedScheduleItem) => { setInitialScheduleItems((prev) => [...prev, newSchedule]); handleDataChanged(); };
  const handleRemoveSchedule = (id: string) => { setInitialScheduleItems((prev) => prev.filter((item) => item.id !== id)); handleDataChanged(); };
  const handleCompleteSchedule = (id: string) => { setInitialScheduleItems((prev) => prev.map((item) => (item.id === id ? { ...item, isCompleted: true } : item))); handleDataChanged(); };

  // Funções de Upload
  const handleAvatarClick = () => { fileInputRef.current?.click(); };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) { setCrop(undefined); const file = e.target.files[0]; if (!file.type.startsWith("image/")) { setActionError("Ficheiro inválido."); return; } if (file.size > 5 * 1024 * 1024) { setActionError("Imagem muito grande (Max 5MB)."); return; } setImageSrc(URL.createObjectURL(file)); setIsCropperOpen(true); setActionError(null); } };
  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) { if (avatarAspect) { const { width, height } = e.currentTarget; setCrop(centerAspectCrop(width, height, avatarAspect)); } }
  const handleCropConfirm = async () => { const image = imgRef.current; const canvas = canvasRef.current; if (!image || !canvas || !completedCrop) { throw new Error('Recursos de corte não estão prontos'); } const scaleX = image.naturalWidth / image.width; const scaleY = image.naturalHeight / image.height; canvas.width = completedCrop.width * scaleX; canvas.height = completedCrop.height * scaleY; const ctx = canvas.getContext('2d'); if (!ctx) { throw new Error('Não foi possível obter o contexto 2D'); } ctx.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, canvas.width, canvas.height); return new Promise<void>((resolve, reject) => { canvas.toBlob((blob) => { if (!blob) { reject(new Error('Falha ao criar blob da imagem cortada')); return; } const croppedFile = new File([blob], "avatar.png", { type: "image/png" }); setSelectedFile(croppedFile); setPreviewImage(URL.createObjectURL(croppedFile)); setIsCropperOpen(false); resolve(); }, 'image/png'); }); };
  const handleAvatarUpload = async (): Promise<string> => { if (!selectedFile) { throw new Error("Nenhum ficheiro selecionado."); } const formData = new FormData(); formData.append("file", selectedFile); formData.append("type", "avatar"); const res = await fetch('/api/profile/upload', { method: 'POST', body: formData }); const { url: newImageUrl, error } = await res.json(); if (!res.ok) { throw new Error(error || "Falha no upload"); } return newImageUrl; };
  const handleBannerClick = () => { bannerFileInputRef.current?.click(); };
  const handleBannerFileChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) { setBannerCrop(undefined); const file = e.target.files[0]; if (!file.type.startsWith("image/")) { setActionError("Ficheiro inválido."); return; } if (file.size > 5 * 1024 * 1024) { setActionError("Imagem muito grande (Max 5MB)."); return; } setBannerImageSrc(URL.createObjectURL(file)); setIsBannerCropperOpen(true); setActionError(null); } };
  function onBannerImageLoad(e: SyntheticEvent<HTMLImageElement>) { if (bannerAspect) { const { width, height } = e.currentTarget; setBannerCrop(centerAspectCrop(width, height, bannerAspect)); } }
  const handleBannerCropConfirm = async () => { const image = bannerImgRef.current; const canvas = canvasRef.current; if (!image || !canvas || !completedBannerCrop) { throw new Error('Recursos de corte não estão prontos'); } const scaleX = image.naturalWidth / image.width; const scaleY = image.naturalHeight / image.height; canvas.width = completedBannerCrop.width * scaleX; canvas.height = completedBannerCrop.height * scaleY; const ctx = canvas.getContext('2d'); if (!ctx) { throw new Error('Não foi possível obter o contexto 2D'); } ctx.drawImage(image, completedBannerCrop.x * scaleX, completedBannerCrop.y * scaleY, completedBannerCrop.width * scaleX, completedBannerCrop.height * scaleY, 0, 0, canvas.width, canvas.height); return new Promise<void>((resolve, reject) => { canvas.toBlob((blob) => { if (!blob) { reject(new Error('Falha ao criar blob do banner')); return; } const croppedFile = new File([blob], "banner.png", { type: "image/png" }); setSelectedBannerFile(croppedFile); setPreviewBanner(URL.createObjectURL(croppedFile)); setIsBannerCropperOpen(false); resolve(); }, 'image/png'); }); };
  const handleBannerUpload = async (): Promise<string> => { if (!selectedBannerFile) { throw new Error("Nenhum ficheiro de banner selecionado."); } const formData = new FormData(); formData.append("file", selectedBannerFile); formData.append("type", "banner"); const res = await fetch('/api/profile/upload', { method: 'POST', body: formData }); const { url: newBannerUrl, error } = await res.json(); if (!res.ok) { throw new Error(error || "Falha no upload do banner"); } return newBannerUrl; };

  const handleSaveSettings = async () => {
    if (!isCreator) return;
    setIsSavingSettings(true); setActionError(null);
    let newImageUrl = session?.user?.image || null;
    let newBannerUrl = session?.user?.profileBannerUrl || null;
    try {
      if (selectedFile) { newImageUrl = await handleAvatarUpload(); }
      if (selectedBannerFile) { newBannerUrl = await handleBannerUpload(); }
      const payload = { 
        name: displayName, bio: bio, profileVisibility: profileVisibility, 
        showToWatchList: showToWatch, showWatchingList: showWatching, showWatchedList: showWatched, showDroppedList: showDropped, 
        image: newImageUrl, profileBannerUrl: newBannerUrl, discordWebhookUrl: discordWebhook, twitchUrl: twitchLink, 
        statFollowers, statMedia, statRegion, 
        youtubeMainUrl: ytMain, youtubeSecondUrl: ytSecond, youtubeThirdUrl: ytThird, youtubeFourthUrl: ytFourth, 
        amazonWishlistUrl: amazonLink, 
      };
      const res = await fetch('/api/profile/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Falha ao guardar definições.'); }
      const newSettings = await res.json();
      if (updateSession) { 
        await updateSession({ 
          ...session, 
          user: { 
            ...session?.user, 
            name: newSettings.name, image: newSettings.image, bio: newSettings.bio, 
            profileVisibility: newSettings.profileVisibility, 
            showToWatchList: newSettings.showToWatchList, showWatchingList: newSettings.showWatchingList, showWatchedList: newSettings.showWatchedList, showDroppedList: newSettings.showDroppedList, 
            profileBannerUrl: newSettings.profileBannerUrl, twitchUsername: newSettings.twitchUsername, 
            youtubeMainUrl: ytMain, youtubeSecondUrl: ytSecond, youtubeThirdUrl: ytThird, youtubeFourthUrl: ytFourth, 
            statFollowers: statFollowers, statMedia: statMedia, statRegion: statRegion, 
            amazonWishlistUrl: amazonLink, 
          } 
        }); 
      }
      toast({ title: "Perfil Atualizado!", description: "As suas alterações foram guardadas com sucesso.", className: "bg-green-600 text-white border-none", });
      setSelectedFile(null); setSelectedBannerFile(null); setIsProfileModalOpen(false);
    } catch (error: any) { 
      console.error("Erro ao guardar definições:", error); 
      setActionError(`Erro: ${error.message}`); 
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message }); 
    } finally { 
      setIsSavingSettings(false); 
      if (fileInputRef.current) fileInputRef.current.value = ""; 
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = ""; 
    }
  };

  const firstName = (displayName || session?.user?.name)?.split(' ')[0] || session?.user?.username || "";
  const fallbackLetter = (session?.user?.name || session?.user?.username || "U").charAt(0).toUpperCase();

  // Se estiver hibernando, mostra a tela preta e BLOQUEIA a UI normal
  if (isHibernating) {
    return (
      <div 
        className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-white cursor-pointer"
        onClick={() => {
          setIsHibernating(false); // Acorda ao clicar
          fetchSharedData(); // Atualiza os dados imediatamente
        }}
      >
        <div className="text-center space-y-4 animate-pulse">
          <div className="w-24 h-24 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto border-4 border-purple-500">
            <span className="text-4xl">💤</span>
          </div>
          <h1 className="text-3xl font-bold">Modo de Economia Ativo</h1>
          <p className="text-gray-400">O painel está dormindo para economizar o Banco de Dados.</p>
          <p className="text-sm bg-white/10 py-2 px-4 rounded-full inline-block">Clique em qualquer lugar para acordar</p>
        </div>
      </div>
    );
  }

  if (isLoading || (status === "authenticated" && isLoading)) {
    return (<div className="flex justify-center items-center min-h-[calc(100vh-80px)]"> <Loader2 className="h-12 w-12 animate-spin text-primary" /> </div>);
  }

  // --- JSX PRINCIPAL ---
  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none', objectFit: 'contain' }} />

      {/* Diálogos Crop Avatar/Banner COM IMAGE OTIMIZADA */}
      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}> 
        <DialogContent className="max-w-md"> 
          <DialogHeader><DialogTitle>Cortar Avatar (1:1)</DialogTitle></DialogHeader> 
          {imageSrc && (
            <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={avatarAspect} circularCrop > 
               <Image 
                 ref={imgRef} 
                 alt="Cortar" 
                 src={imageSrc} 
                 width={500}
                 height={500}
                 onLoad={onImageLoad} 
                 style={{ maxHeight: '70vh', width: 'auto', height: 'auto' }} 
                 unoptimized={true} // 👈 Proteção Vercel
               /> 
            </ReactCrop>
          )} 
          <DialogFooter> <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose> <Button onClick={handleCropConfirm}>Confirmar</Button> </DialogFooter> 
        </DialogContent> 
      </Dialog>

      <Dialog open={isBannerCropperOpen} onOpenChange={setIsBannerCropperOpen}> 
        <DialogContent className="max-w-2xl"> 
          <DialogHeader><DialogTitle>Cortar Banner (16:9)</DialogTitle></DialogHeader> 
          {bannerImageSrc && (
            <ReactCrop crop={bannerCrop} onChange={(_, percentCrop) => setBannerCrop(percentCrop)} onComplete={(c) => setCompletedBannerCrop(c)} aspect={bannerAspect} > 
               <Image 
                 ref={bannerImgRef} 
                 alt="Cortar" 
                 src={bannerImageSrc} 
                 width={800}
                 height={450}
                 onLoad={onBannerImageLoad} 
                 style={{ maxHeight: '70vh', width: '100%', height: 'auto' }} 
                 unoptimized={true} // 👈 Proteção Vercel
               /> 
            </ReactCrop>
          )} 
          <DialogFooter> <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose> <Button onClick={handleBannerCropConfirm}>Confirmar</Button> </DialogFooter> 
        </DialogContent> 
      </Dialog>

      {/* Modal de Configurações */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurações do Perfil</DialogTitle>
            <DialogDescription>Personalize sua página pública e integrações.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Aparência */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2 border-b pb-2"> <Upload className="h-5 w-5" /> Aparência </h3>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center gap-3">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" className="hidden" />
                  <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                    <Avatar className="h-24 w-24 border-2 border-muted">
                      <AvatarImage src={previewImage || undefined} />
                      <AvatarFallback className="text-2xl">{fallbackLetter}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"> <Pen className="h-6 w-6 text-white" /> </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Avatar</span>
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Banner do Perfil</Label>
                  <input type="file" ref={bannerFileInputRef} onChange={handleBannerFileChange} accept="image/png, image/jpeg, image/gif" className="hidden" />
                  <div className="relative w-full h-24 bg-muted rounded-md overflow-hidden group cursor-pointer border" onClick={handleBannerClick}>
                    {previewBanner ? (
                        <Image src={previewBanner} alt="Banner" fill className="object-cover" unoptimized={true} />
                    ) : (<div className="flex items-center justify-center h-full text-muted-foreground text-xs">Sem banner</div>)}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"> <span className="text-white text-sm font-medium flex items-center gap-2"><Upload className="h-4 w-4" /> Alterar</span> </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"> <Label htmlFor="display-name">Nome de Exibição</Label> <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} /> </div>
                <div className="space-y-2"> <Label htmlFor="bio">Bio</Label> <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte um pouco sobre você..." className="min-h-[150px] resize-y" /> </div>
              </div>
            </div>

            {/* YouTube */}
            <div className="space-y-3 border p-4 rounded-md border-red-900/20 bg-red-500/5">
              <Label className="flex items-center gap-2 text-red-400 font-bold">
                <div className="bg-red-600 p-1 rounded text-white"><Tv size={14} /></div>
                Meus Canais do YouTube
              </Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Principal (Mahcetou)</Label>
                  <Input placeholder="URL do canal..." value={ytMain} onChange={e => setYtMain(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Secundário (Cinemah)</Label>
                  <Input placeholder="URL do canal..." value={ytSecond} onChange={e => setYtSecond(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Terceiro (Mahnimes)</Label>
                  <Input placeholder="URL do canal..." value={ytThird} onChange={e => setYtThird(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quarto (Mahmoojenlives)</Label>
                  <Input placeholder="URL do canal..." value={ytFourth} onChange={e => setYtFourth(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Amazon Wishlist */}
            <div className="space-y-2 border p-3 rounded-md border-orange-900/20 bg-orange-500/5">
              <Label className="flex items-center gap-2 text-orange-500 font-bold">
                <Gift className="w-4 h-4" /> Amazon Wishlist
              </Label>
              <Input
                placeholder="Cole o link da sua Lista de Desejos aqui..."
                value={amazonLink}
                onChange={(e) => setAmazonLink(e.target.value)}
              />
              <p className="text-[10px] text-gray-400">
                O link público da sua lista de presentes da Amazon.
              </p>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2 border-b pb-2 mt-4">
                <BarChart className="h-5 w-5" /> Stats da Home
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Seguidores</Label>
                  <Input
                    placeholder="Ex: 65K+"
                    value={statFollowers}
                    onChange={(e) => setStatFollowers(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mídias</Label>
                  <Input
                    placeholder="Ex: 1.2k+"
                    value={statMedia}
                    onChange={(e) => setStatMedia(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Região</Label>
                  <Input
                    placeholder="Ex: BR"
                    value={statRegion}
                    onChange={(e) => setStatRegion(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Integrações */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2 border-b pb-2 mt-4"> <Share2 className="h-5 w-5" /> Integrações </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 border p-3 rounded-md">
                  <Label className="flex items-center gap-2"> <div className="bg-[#9146FF] p-1 rounded text-white"><Tv size={14} /></div> Canal da Twitch </Label>
                  <Input placeholder="https://twitch.tv/seu_nick" value={twitchLink} onChange={(e) => setTwitchLink(e.target.value)} />
                </div>
                <div className="space-y-2 border p-3 rounded-md">
                  <Label className="flex items-center gap-2"> <div className="bg-[#5865F2] p-1 rounded text-white"><Share2 size={14} /></div> Webhook do Discord </Label>
                  <Input type="password" placeholder="https://discord.com/api/webhooks/..." value={discordWebhook} onChange={(e) => setDiscordWebhook(e.target.value)} />
                </div>
              </div>
            </div>
            {/* Visibilidade */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2 border-b pb-2 mt-4"> <Eye className="h-5 w-5" /> Privacidade </h3>
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label>Quem pode ver seu perfil?</Label>
                  <RadioGroup value={profileVisibility} onValueChange={(value: ProfileVisibility) => setProfileVisibility(value)} className="flex gap-4" >
                    <div className="flex items-center space-x-2"> <RadioGroupItem value="PUBLIC" id="r1" /> <Label htmlFor="r1" className="font-normal">Público</Label> </div>
                    <div className="flex items-center space-x-2"> <RadioGroupItem value="FOLLOWERS_ONLY" id="r2" /> <Label htmlFor="r2" className="font-normal">Apenas Seguidores</Label> </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Listas Visíveis</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2 border p-2 rounded"> <Switch id="show-towatch" checked={showToWatch} onCheckedChange={setShowToWatch} /> <Label htmlFor="show-towatch" className="text-xs cursor-pointer">Próximos</Label> </div>
                    <div className="flex items-center space-x-2 border p-2 rounded"> <Switch id="show-watching" checked={showWatching} onCheckedChange={setShowWatching} /> <Label htmlFor="show-watching" className="text-xs cursor-pointer">Essa Semana</Label> </div>
                    <div className="flex items-center space-x-2 border p-2 rounded"> <Switch id="show-watched" checked={showWatched} onCheckedChange={setShowWatched} /> <Label htmlFor="show-watched" className="text-xs cursor-pointer">Já Assistido</Label> </div>
                    <div className="flex items-center space-x-2 border p-2 rounded"> <Switch id="show-dropped" checked={showDropped} onCheckedChange={setShowDropped} /> <Label htmlFor="show-dropped" className="text-xs cursor-pointer">Abandonados</Label> </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter> <Button variant="outline" onClick={() => setIsProfileModalOpen(false)}>Cancelar</Button> <Button onClick={handleSaveSettings} disabled={isSavingSettings}> {isSavingSettings ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />} Salvar Alterações </Button> </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 md:py-12">

          {/* Cabeçalho do Dashboard */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Olá, {firstName}!</h1>
              <p className="text-lg text-muted-foreground">Gestão do seu cronograma e perfil.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isCreator && (
                <>
                  <Button variant="secondary" onClick={() => router.push('/dashboard/sponsors')} className="gap-2 hidden md:flex hover:bg-blue-600 hover:text-white">
                    <Handshake className="h-4 w-4" /> Sponsors
                  </Button>
                  <Button variant="secondary" onClick={() => router.push('/dashboard/social')} className="gap-2 hidden md:flex hover:bg-pink-600 hover:text-white">
                    <Share2 className="h-4 w-4" /> Redes
                  </Button>
                  <Button
                    id="btn-editar-perfil"
                    variant="secondary"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Configurações
                  </Button>
                </>
              )}
            </div>
          </div>

          {isUpdating && (<div className="fixed top-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse"> A atualizar... </div>)}
          {actionError && (<Alert variant="destructive" className="mb-4"> <AlertDescription>{actionError}</AlertDescription> </Alert>)}

          {/* Conteúdo Principal (Abas) */}
          <div className="w-full">
            <Tabs defaultValue="listas" className="w-full">

              <TabsList className="grid w-full grid-cols-4 md:max-w-2xl mx-auto mb-8 h-auto p-1 bg-muted/50">
                <TabsTrigger value="listas" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"> <List className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Listas</span> </TabsTrigger>
                <TabsTrigger value="agenda" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"> <CalendarDays className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Agenda</span> </TabsTrigger>
                <TabsTrigger value="calendario" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"> <Calendar className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Calendário</span> </TabsTrigger>
                <TabsTrigger value="stats" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"> <BarChart className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Estatísticas</span> </TabsTrigger>
              </TabsList>

              <TabsContent value="listas" className="mt-0 space-y-8 animate-in fade-in duration-500">
                <MediaSearch onMediaAdded={handleDataChanged} />
                <MyLists onDataChanged={handleDataChanged} dataVersionKey={dataVersionKey} />
              </TabsContent>

              <TabsContent value="agenda" className="mt-0 animate-in fade-in duration-500">
                <ScheduleManager mediaItems={mediaItems} scheduleItems={scheduleItems} onAddSchedule={handleAddSchedule} onRemoveSchedule={handleRemoveSchedule} onCompleteSchedule={handleCompleteSchedule} />
              </TabsContent>

              <TabsContent value="calendario" className="mt-0 animate-in fade-in duration-500">
                <FullCalendar key={dataVersionKey} scheduleItems={scheduleItems} />
              </TabsContent>

              <TabsContent value="stats" className="mt-0 animate-in fade-in duration-500">
                <StatsTab />
              </TabsContent>

            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
}