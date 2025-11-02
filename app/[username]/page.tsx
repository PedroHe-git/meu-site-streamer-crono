// app/[username]/page.tsx

import prisma from '@/lib/prisma';
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
// --- [MUDANÇA 1] ---
// Importa Prisma e tipos necessários para a query
import { ProfileVisibility, UserRole, Prisma, MediaStatus, Media } from "@prisma/client"; 
import { cn } from "@/lib/utils";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock } from 'lucide-react';

import FollowButton from "@/app/components/FollowButton";
import UserListsClient from "@/app/components/UserListsClient";
import LiveStatusIndicator from "@/app/components/LiveStatusIndicator";
import PublicScheduleView from "@/app/components/PublicScheduleView";

type PublicProfileProps = {
  username: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  profileVisibility: ProfileVisibility;
  role: UserRole;
  followersCount: number;
  followingCount: number;
}

// --- [MUDANÇA 2] ---

// 1. Definir tipos de dados que o UserListsClient espera
type MediaStatusWithMedia = MediaStatus & { media: Media; };
type InitialListData = { items: MediaStatusWithMedia[]; totalCount: number; };

// 2. Definir o tamanho da página inicial
const PAGE_SIZE = 20;

// 3. Função helper para buscar os dados de uma lista
async function getInitialListData(userId: string, status: Prisma.EnumMovieStatusTypeFilter['equals']): Promise<InitialListData> {
  const whereCondition: Prisma.MediaStatusWhereInput = {
    userId: userId,
    status: status,
  };

  try {
    const [items, totalCount] = await prisma.$transaction([
      prisma.mediaStatus.findMany({
        where: whereCondition,
        include: { media: true },
        skip: 0,
        take: PAGE_SIZE,
        orderBy: { media: { title: 'asc' } }
      }),
      prisma.mediaStatus.count({
        where: whereCondition,
      })
    ]);
    return { items, totalCount };
  } catch (error) {
    console.error(`Falha ao buscar lista inicial ${status}:`, error);
    // Retorna vazio em caso de erro
    return { items: [], totalCount: 0 };
  }
}
// --- [FIM DA MUDANÇA 2] ---


export default async function PublicProfilePage({ params, searchParams }: { params: { username: string }, searchParams: { [key: string]: string | string[] | undefined } }) {

  const session = await getServerSession(authOptions);
  const decodedUsername = decodeURIComponent(params.username);
  
  // 1. Buscar o utilizador do perfil e contagens
  const profileUser = await prisma.user.findUnique({
    where: { username: decodedUsername },
    select: {
      id: true,
      username: true, 
      name: true,
      image: true,
      bio: true,
      profileVisibility: true,
      role: true, 
      twitchUsername: true, // <-- Adicionado para o LiveStatusIndicator
      _count: {
        select: {
          followers: true,
          following: true,
        }
      }
    }
  });

  if (!profileUser) {
    notFound();
  }
  
  // 2. Verificar se o visitante (sessão) está a seguir o utilizador do perfil
  let isFollowing = false;
  if (session?.user?.id) {
    const followRelation = await prisma.follows.findFirst({
      where: {
        followerId: session.user.id,
        followingId: profileUser.id,
      }
    });
    isFollowing = !!followRelation;
  }
  
  // 3. Verificar Permissões de Privacidade
  const isOwner = session?.user?.id === profileUser.id;
  const canViewProfile = 
    profileUser.profileVisibility === ProfileVisibility.PUBLIC || 
    isOwner || 
    (profileUser.profileVisibility === ProfileVisibility.FOLLOWERS_ONLY && isFollowing);

  const fallbackLetter = (profileUser.name || profileUser.username).charAt(0).toUpperCase();

  // 4. Selecionar a aba ativa (padrão é 'cronograma')
  const defaultTab = "cronograma";
  const allowedTabs = ["cronograma", "listas"];
  let activeTab = defaultTab;
  
  if (searchParams?.tab && typeof searchParams.tab === 'string' && allowedTabs.includes(searchParams.tab)) {
    activeTab = searchParams.tab;
  }

  // --- [MUDANÇA 3] ---
  // 5. Buscar os dados das listas SE o perfil puder ser visto
  let initialLists: Record<string, InitialListData> = {
    toWatch: { items: [], totalCount: 0 },
    watching: { items: [], totalCount: 0 },
    watched: { items: [], totalCount: 0 },
    dropped: { items: [], totalCount: 0 },
  };

  if (canViewProfile) {
    // Usamos Promise.all para buscar todas as listas em paralelo
    const [toWatchData, watchingData, watchedData, droppedData] = await Promise.all([
      getInitialListData(profileUser.id, "TO_WATCH"),
      getInitialListData(profileUser.id, "WATCHING"),
      getInitialListData(profileUser.id, "WATCHED"),
      getInitialListData(profileUser.id, "DROPPED"),
    ]);
    initialLists = {
      toWatch: toWatchData,
      watching: watchingData,
      watched: watchedData,
      dropped: droppedData,
    };
  }
  // --- [FIM DA MUDANÇA 3] ---


  return (
    <div className={cn("bg-background text-foreground")}>
      <div className={cn(
        "container mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12 lg:py-16",
        "transition-all duration-300 ease-in-out"
      )}>

        {/* Cabeçalho (Sempre visível) */}
        <div className="text-center mb-12">
            
            <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-muted shadow-md">
              <AvatarImage src={profileUser.image || undefined} alt={profileUser.username} />
              <AvatarFallback className="text-4xl">{fallbackLetter}</AvatarFallback>
            </Avatar>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 flex items-center justify-center gap-3 flex-wrap">
              <span>{profileUser.name || profileUser.username}</span>
              {/* [MUDANÇA 4] Só renderiza se for CREATOR E tiver um twitchUsername vinculado */}
              {profileUser.role === UserRole.CREATOR && profileUser.twitchUsername && (
                <LiveStatusIndicator username={decodedUsername} />
              )}
            </h1>

            {profileUser.bio && (
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                {profileUser.bio}
              </p>
            )}

            {/* Contagens e Botão de Seguir */}
            <div className="flex justify-center items-center gap-6 mt-6">
              <div className="text-center">
                <span className="text-xl font-bold block">{profileUser._count.followers}</span>
                <span className="text-sm text-muted-foreground">Seguidores</span>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold block">{profileUser._count.following}</span>
                <span className="text-sm text-muted-foreground">A Seguir</span>
              </div>
              
              {session && !isOwner && (
                <FollowButton
                  username={decodedUsername} 
                  initialIsFollowing={isFollowing}
                  disabled={profileUser.role !== UserRole.CREATOR}
                />
              )}
            </div>
        </div>

        {/* Conteúdo Principal (Listas e Cronograma) */}
        {canViewProfile ? (
          <Tabs defaultValue={activeTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
              <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
              <TabsTrigger value="listas">Listas</TabsTrigger>
            </TabsList>

            {/* Conteúdo da Aba "Cronograma" */}
            <TabsContent value="cronograma">
              <PublicScheduleView username={decodedUsername} />
            </TabsContent>

            {/* --- [MUDANÇA 5] --- */}
            {/* Conteúdo da Aba "Listas" */}
            <TabsContent value="listas">
              <UserListsClient
                username={decodedUsername}
                initialToWatch={initialLists.toWatch}
                initialWatching={initialLists.watching}
                initialWatched={initialLists.watched}
                initialDropped={initialLists.dropped}
              />
            </TabsContent>
            {/* --- [FIM DA MUDANÇA 5] --- */}

          </Tabs>
        ) : (
          // Ecrã de Perfil Privado
          <Card className="max-w-md mx-auto mt-12">
            <CardContent className="p-8 text-center">
              <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-semibold mb-2">Perfil Privado</h2>
              <p className="text-muted-foreground">
                Este perfil é privado. Siga <span className="font-bold">{profileUser.username}</span> para ver o seu cronograma e listas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}