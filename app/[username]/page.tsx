// app/[username]/page.tsx (Corrigido)

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ProfileVisibility, UserRole, Prisma, MediaStatus, Media } from "@prisma/client"; 

// --- [CORREÇÃO DE CAMINHOS DE IMPORT] ---
// Garante que os caminhos para os componentes estão corretos
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FollowButton from "@/app/components/FollowButton";
import UserListsClient from "@/app/components/UserListsClient";
import PublicScheduleView from "@/app/components/PublicScheduleView";
import LiveStatusIndicator from "@/app/components/LiveStatusIndicator";
import { Badge } from "@/app/components/ui/badge";
import {Lock } from "lucide-react"; // Adiciona o Lock
// --- [FIM DA CORREÇÃO DE CAMINHOS] ---


// Tipos para as listas
type MediaStatusWithMedia = MediaStatus & { media: Media; };
type InitialListData = { items: MediaStatusWithMedia[]; totalCount: number; };
const PAGE_SIZE = 20;

// Função de busca unificada
async function fetchUserByUsername(username: string) {
  const lowerCaseUsername = decodeURIComponent(username).toLowerCase();
  
  const user = await prisma.user.findUnique({
    where: {
      username: lowerCaseUsername, // Procura sempre em minúsculas
    },
    // Seleciona todos os campos necessários
    select: {
      id: true,
      username: true, 
      name: true,
      image: true,
      bio: true,
      profileVisibility: true,
      role: true, 
      twitchUsername: true,
      _count: {
        select: {
          followers: true,
          following: true,
        }
      },
      showToWatchList: true,
      showWatchingList: true,
      showWatchedList: true,
      showDroppedList: true
    }
  });
  return user;
}

// Função helper para buscar os dados de uma lista
async function getInitialListData(
  userId: string, 
  status: Prisma.EnumMovieStatusTypeFilter['equals'],
  isVisible: boolean, // Flag de visibilidade
  isOwner: boolean     // Flag se é o dono
): Promise<InitialListData> {
  
  // Se a lista não for visível E não for o dono a ver, retorna vazio
  if (!isVisible && !isOwner) {
    return { items: [], totalCount: 0 };
  }

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
    return { items: [], totalCount: 0 };
  }
}


// generateMetadata (Atualizado)
export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const user = await fetchUserByUsername(params.username);

  if (!user) {
    return {
      title: "Perfil Não Encontrado",
    };
  }

  return {
    title: `${user.name} (@${user.username})`,
    description: user.bio || `Veja o perfil e o cronograma de ${user.name} no MeuCronograma.`,
    openGraph: {
      title: `${user.name} (@${user.username})`,
      description: user.bio || "Veja o perfil e o cronograma.",
      images: [
        {
          url: user.image || "/images/placeholder.png",
          width: 800,
          height: 600,
          alt: user.name || user.username,
        },
      ],
    },
  };
}

// ProfilePage (Atualizado)
export default async function ProfilePage({
  params,
  searchParams
}: {
  params: { username: string };
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getServerSession(authOptions);
  const user = await fetchUserByUsername(params.username);

  if (!user) {
    notFound();
  }
  // @ts-ignore
  const loggedInUserId = session?.user?.id;
  const isOwner = loggedInUserId === user.id;

  let isFollowing = false;
  if (loggedInUserId && !isOwner) {
    const follow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: loggedInUserId,
          followingId: user.id,
        },
      },
    });
    isFollowing = !!follow;
  }

  const isPrivate = user.profileVisibility === ProfileVisibility.FOLLOWERS_ONLY;
  const canViewProfile = !isPrivate || isOwner || isFollowing;
  const fallbackLetter = (user.name || user.username).charAt(0).toUpperCase();

  // Selecionar a aba ativa
  const defaultTab = "cronograma";
  const allowedTabs = ["cronograma", "listas"];
  let activeTab = defaultTab;
  
  if (searchParams?.tab && typeof searchParams.tab === 'string' && allowedTabs.includes(searchParams.tab)) {
    activeTab = searchParams.tab;
  }

  // Buscar os dados das listas (agora verifica a visibilidade)
  let initialLists: Record<string, InitialListData> = {
    toWatch: { items: [], totalCount: 0 },
    watching: { items: [], totalCount: 0 },
    watched: { items: [], totalCount: 0 },
    dropped: { items: [], totalCount: 0 },
  };

  if (canViewProfile) {
    const [toWatchData, watchingData, watchedData, droppedData] = await Promise.all([
      getInitialListData(user.id, "TO_WATCH", user.showToWatchList, isOwner),
      getInitialListData(user.id, "WATCHING", user.showWatchingList, isOwner),
      getInitialListData(user.id, "WATCHED", user.showWatchedList, isOwner),
      getInitialListData(user.id, "DROPPED", user.showDroppedList, isOwner),
    ]);
    initialLists = {
      toWatch: toWatchData,
      watching: watchingData,
      watched: watchedData,
      dropped: droppedData,
    };
  }


  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      {/* Header do Perfil */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <Avatar className="h-28 w-28 border-4 border-muted">
          <AvatarImage src={user.image || undefined} alt={user.username} />
          <AvatarFallback className="text-4xl">{fallbackLetter}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <h1 className="text-3xl font-bold">{user.name}</h1>
            {user.role === UserRole.CREATOR && (
              <Badge variant="outline" className="text-blue-500 border-blue-500">
                Criador
              </Badge>
            )}
            {user.twitchUsername && <LiveStatusIndicator username={user.username} />}
          </div>
          <p className="text-lg text-muted-foreground">@{user.username}</p>
          {user.bio && <p className="text-md text-foreground max-w-lg">{user.bio}</p>}
          <div className="flex gap-4 justify-center sm:justify-start pt-2">
            <div className="text-center">
              <span className="font-bold">{user._count.followers}</span>
              <span className="text-muted-foreground ml-1">Seguidores</span>
            </div>
            <div className="text-center">
              <span className="font-bold">{user._count.following}</span>
              <span className="text-muted-foreground ml-1">A Seguir</span>
            </div>
          </div>
          <div className="pt-2 flex justify-center sm:justify-start">
            
            {/* --- [INÍCIO DA CORREÇÃO] --- */}
            {/* O FollowButton espera o 'username' do perfil, não os IDs */}
            {!isOwner && loggedInUserId && (
              <FollowButton
                username={user.username}
                initialIsFollowing={isFollowing}
              />
            )}
            {/* --- [FIM DA CORREÇÃO] --- */}

          </div>
        </div>
      </div>

      {/* Conteúdo (Listas e Cronograma) */}
      {!canViewProfile ? (
        <div className="text-center py-20">
          <Lock className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Este perfil é privado</h2>
          <p className="text-muted-foreground">
            Siga este utilizador para ver o seu cronograma e listas.
          </p>
        </div>
      ) : (
        <Tabs defaultValue={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
            <TabsTrigger value="listas">Listas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cronograma" className="mt-6">
            <PublicScheduleView username={user.username} />
          </TabsContent>
          
          <TabsContent value="listas" className="mt-6">
            <UserListsClient
              username={user.username}
              initialToWatch={initialLists.toWatch}
              initialWatching={initialLists.watching}
              initialWatched={initialLists.watched}
              initialDropped={initialLists.dropped}
              // Passa as flags de visibilidade (já com a lógica 'isOwner' aplicada)
              showToWatch={user.showToWatchList || isOwner}
              showWatching={user.showWatchingList || isOwner}
              showWatched={user.showWatchedList || isOwner}
              showDropped={user.showDroppedList || isOwner}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}