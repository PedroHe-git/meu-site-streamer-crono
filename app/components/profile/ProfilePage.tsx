// app/components/profile/ProfilePage.tsx
"use client";

import { User, Calendar, Film, Lock, Pen, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import FollowButton from "@/app/components/FollowButton";
import LiveStatusIndicator from "@/app/components/LiveStatusIndicator";
import PublicScheduleView from "@/app/components/PublicScheduleView";
import UserListsClient from "@/app/components/UserListsClient";
import Image from "next/image"; 
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Media, MediaStatus, ScheduleItem, ProfileVisibility, User as PrismaUser } from "@prisma/client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
// Imports da IA (removidos daqui, pois estão no PublicScheduleView)

// --- Tipos Atualizados ---
type ListCounts = {
  TO_WATCH: number;
  WATCHING: number;
  WATCHED: number;
  DROPPED: number;
};

type ProfileUser = PrismaUser & {
  followersCount: number;
  followingCount: number;
};

type ScheduleItemWithMedia = ScheduleItem & { media: Media };

type ProfilePageProps = {
  user: ProfileUser;
  isOwner: boolean;
  isFollowing: boolean;
  canViewProfile: boolean;
  activeTab?: "cronograma" | "listas";
  listCounts: ListCounts;
  initialSchedule: ScheduleItemWithMedia[] | null;
  initialWeekRange: { start: string, end: string } | null;
  aiSummary: string | null; // <-- Recebe a prop
};
// --- Fim dos Tipos ---


export default function ProfilePage({
  user,
  isOwner,
  isFollowing,
  canViewProfile,
  activeTab = "cronograma",
  listCounts,
  initialSchedule,
  initialWeekRange,
  aiSummary // <-- Recebe a prop
}: ProfilePageProps) {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (!user) {
    return (
      <div className="container mx-auto max-w-5xl py-8">
        <Card className="shadow-lg border-2">
          <CardContent className="p-12 text-center">
            <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
            <h2 className="text-2xl font-bold">A Carregar Perfil...</h2>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const fallbackLetter = (user.name || user.username).charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      
      {/* Secção Hero (Corrigida com 'fill' e 'object-cover') */}
      <div className="p-8 pt-28 md:pt-32 relative overflow-hidden">
        {user.profileBannerUrl ? (
          <Image
            src={user.profileBannerUrl}
            alt="Banner do perfil"
            fill
            className="absolute inset-0 z-0 object-cover"
            priority 
          />
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700"></div>
        )}
        <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm"></div>
        
        <div className="container mx-auto max-w-5xl relative z-20">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="relative -mt-20 md:-mt-24 flex-shrink-0">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white shadow-lg">
                <AvatarImage src={user.image ?? undefined} alt={user.username} />
                <AvatarFallback className="text-5xl">{fallbackLetter}</AvatarFallback>
              </Avatar>
              {user.twitchUsername && (
                <LiveStatusIndicator
                  username={user.twitchUsername}
                  className="absolute bottom-2 right-2"
                />
              )}
            </div>

            {/* Informação do Utilizador */}
            <div className="flex-1 text-center md:text-left text-white min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold truncate">{user.name || user.username}</h1>
              <p className="text-sm text-purple-100 mb-2">@{user.username}</p>
              <p className="text-purple-50 leading-relaxed max-w-xl mx-auto md:mx-0">
                {user.bio || "Este utilizador ainda não adicionou uma bio."}
              </p>
              
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-6 mt-4">
                
                {/* Stats de Seguidores */}
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="font-bold text-lg">{user.followersCount}</p>
                    <p className="text-xs text-purple-100">Seguidores</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">{user.followingCount}</p>
                    <p className="text-xs text-purple-100">A Seguir</p>
                  </div>
                </div>

                {/* Botão de Seguir/Editar */}
                <div className="flex-shrink-0 w-full md:w-auto">
                  {isOwner ? (
                    <Link 
                      href="/dashboard" // <-- [CORRIGIDO] Underscore removido
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }), 
                        "w-full md:w-36 bg-white/20 text-white border-white/30 hover:bg-white/30"
                      )}
                    >
                      <Pen className="h-4 w-4 mr-2" />
                      Editar Perfil
                    </Link>
                  ) : (
                    <FollowButton
                      isFollowingInitial={isFollowing}
                      username={user.username}
                      className="w-full md:w-36"
                    />
                  )} {/* <-- [CORRIGIDO] Underscore removido */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal (Abas) */}
      <div className="container mx-auto max-w-5xl py-8">
        {!canViewProfile ? (
          // Mensagem de Perfil Privado
          <Card className="shadow-lg border-2">
            <CardContent className="p-12 text-center">
              <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold">Este perfil é privado</h2>
              <p className="text-muted-foreground mt-2">
                Siga este utilizador para ver o seu cronograma e conteúdos.
              </p>
            </CardContent>
          </Card>
        ) : (
          // Conteúdo das Abas (se o perfil for visível)
          <Tabs 
            value={activeTab} 
            onValueChange={handleTabChange} 
            className="w-full"
          >
            <div className="flex justify-center mb-4">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="cronograma">
                  <Calendar className="h-4 w-4 mr-2" />
                  Cronograma
                </TabsTrigger>
                <TabsTrigger value="listas">
                  <Film className="h-4 w-4 mr-2" />
                  Conteúdos
                </TabsTrigger>
              </TabsList>
            </div>

            <Card className="shadow-lg border-2">
              <CardContent className="p-6">
                
                {/* --- ABA CRONOGRAMA --- */}
                <TabsContent value="cronograma" className="mt-0">
                  <PublicScheduleView 
                    username={user.username}
                    initialSchedule={initialSchedule}
                    initialWeekRange={initialWeekRange}
                    initialAiSummary={aiSummary} // <-- Passa o resumo para o componente
                  />
                </TabsContent>

                {/* --- ABA LISTAS --- */}
                <TabsContent value="listas" className="mt-0">
                  <UserListsClient
                    username={user.username}
                    showToWatchList={user.showToWatchList}
                    showWatchingList={user.showWatchingList}
                    showWatchedList={user.showWatchedList}
                    showDroppedList={user.showDroppedList}
                    isOwner={isOwner} 
                    counts={listCounts} 
                  />
                </TabsContent>
                
              </CardContent>
            </Card>
          </Tabs>
        )}
      </div>

      <div className="h-16"></div>
    </div>
  );
}