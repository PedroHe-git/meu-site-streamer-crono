"use client";

import { useState } from "react";
import { Calendar, Film, Lock, Pen, Loader2, Link as LinkIcon, Share2, Tv, Upload, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FollowButton from "@/app/components/FollowButton";
import LiveStatusIndicator from "@/app/components/LiveStatusIndicator";
import PublicScheduleView from "@/app/components/PublicScheduleView";
import UserListsClient from "@/app/components/UserListsClient";
import Image from "next/image"; 
import Link from "next/link";
import { buttonVariants, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Media, MediaStatus, ScheduleItem, User as PrismaUser } from "@prisma/client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

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
  aiSummary: string | null; 
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
  aiSummary
}: ProfilePageProps) {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Função para redirecionar ao Dashboard
  const handleEditProfile = () => {
      router.push("/dashboard");
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
      
      {/* Hero Section */}
      <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        {/* Banner */}
        {user.profileBannerUrl ? (
          <Image
            src={user.profileBannerUrl}
            alt="Banner do perfil"
            fill
            className="object-cover"
            priority 
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
        
        {/* Informações do Usuário */}
        <div className="absolute bottom-0 left-0 right-0 pb-8 pt-20 px-4">
            <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-end gap-6 md:gap-8">
                
                {/* Avatar + Status Live */}
                <div className="relative flex-shrink-0">
                    <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-xl ring-2 ring-border/20">
                        <AvatarImage src={user.image ?? undefined} alt={user.username} className="object-cover"/>
                        <AvatarFallback className="text-4xl bg-muted text-muted-foreground">{fallbackLetter}</AvatarFallback>
                    </Avatar>
                    
                    {/* Indicador de Live (Desacoplado do Banco) */}
                    {user.twitchUsername && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20">
                           <LiveStatusIndicator twitchChannel={user.twitchUsername} />
                        </div>
                    )}
                </div>

                <div className="flex-1 w-full text-center md:text-left mb-2 md:mb-4 space-y-2">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <h1 className="text-3xl md:text-5xl font-bold text-foreground drop-shadow-sm">
                            {user.name || user.username}
                        </h1>
                      </div>
                      
                      <p className="text-muted-foreground font-medium">@{user.username}</p>
                      
                      {user.bio && (
                        <p className="text-foreground/90 text-sm md:text-base max-w-2xl leading-relaxed line-clamp-3 md:line-clamp-none mx-auto md:mx-0">
                            {user.bio}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-4">
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-foreground">{user.followersCount}</span>
                            <span className="text-muted-foreground text-sm">Seguidores</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-foreground">{user.followingCount}</span>
                            <span className="text-muted-foreground text-sm">A Seguir</span>
                        </div>

                        <div className="md:ml-auto flex gap-2 w-full md:w-auto">
                             {isOwner ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full md:w-auto bg-white/10 text-foreground border-white/20 hover:bg-white/20 backdrop-blur-md"
                                  // Alterado para redirecionar para o Dashboard
                                  onClick={handleEditProfile}
                                >
                                <Pen className="h-4 w-4 mr-2" />
                                Editar Perfil
                                </Button>
                            ) : (
                                <FollowButton
                                isFollowingInitial={isFollowing}
                                username={user.username}
                                className="w-full md:w-auto min-w-[120px]"
                                />
                            )}
                        </div>
                      </div>
                </div>
            </div>
        </div>
      </div>

      {/* Conteúdo Principal (Abas) */}
      <div className="container mx-auto max-w-5xl py-8 px-4">
        {!canViewProfile ? (
          <Card className="shadow-lg border-2 border-dashed">
            <CardContent className="p-16 text-center flex flex-col items-center">
              <div className="bg-muted p-4 rounded-full mb-4">
                 <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Este perfil é privado</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                As listas e o cronograma de <strong>@{user.username}</strong> são visíveis apenas para seguidores aprovados.
              </p>
              {!isFollowing && !isOwner && (
                 <div className="mt-6">
                    <FollowButton 
                        isFollowingInitial={false} 
                        username={user.username}
                        className="min-w-[140px]"
                    />
                 </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Tabs 
            value={activeTab} 
            onValueChange={handleTabChange} 
            className="w-full"
          >
            <div className="flex justify-center md:justify-start mb-8 border-b pb-1">
              <TabsList className="bg-transparent p-0 h-auto gap-6">
                <TabsTrigger 
                    value="cronograma"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-base text-muted-foreground data-[state=active]:text-foreground transition-all hover:text-foreground"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Cronograma
                </TabsTrigger>
                <TabsTrigger 
                    value="listas"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-base text-muted-foreground data-[state=active]:text-foreground transition-all hover:text-foreground"
                >
                  <Film className="h-4 w-4 mr-2" />
                  Conteúdos
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <TabsContent value="cronograma" className="mt-0 focus-visible:outline-none">
                  <PublicScheduleView 
                    username={user.username}
                    initialSchedule={initialSchedule}
                    initialWeekRange={initialWeekRange}
                    initialAiSummary={aiSummary} 
                  />
                </TabsContent>

                <TabsContent value="listas" className="mt-0 focus-visible:outline-none">
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
            </div>
          </Tabs>
        )}
      </div>

      <div className="h-16"></div>
    </div>
  );
}