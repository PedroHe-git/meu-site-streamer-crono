// app/[username]/page.tsx (Corrigido para sempre retornar o mesmo 'user' shape)

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProfilePage from "@/app/components/profile/ProfilePage";
import { ProfileVisibility, Prisma, MovieStatusType, Media, ScheduleItem, User } from "@prisma/client";
import { addDays, startOfWeek, endOfWeek, startOfDay, endOfDay, format } from "date-fns";

export const revalidate = 120;

// --- Tipos para os dados ---
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";

// O tipo que o ProfilePage.tsx espera: User + contagens planas
type ProfileUser = User & {
  followersCount: number;
  followingCount: number;
};

type ScheduleItemWithMedia = ScheduleItem & { media: Media };
type ListCounts = {
  TO_WATCH: number;
  WATCHING: number;
  WATCHED: number;
  DROPPED: number;
};
// --- Fim dos Tipos ---


/**
 * Função de busca de dados unificada
 */
async function getUserProfileData(username: string, sessionUserId: string | undefined) {
  
  // 1. Buscar o Usuário e suas contagens de seguidores
  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: decodeURIComponent(username),
        mode: 'insensitive'
      }
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user || user.role !== "CREATOR") {
    notFound(); // Usuário não existe ou não é criador
  }

  // 2. Verificar permissões (isOwner, isFollowing)
  let isFollowing = false;
  const isOwner = user.id === sessionUserId;

  if (sessionUserId && !isOwner) {
    const followRelation = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: sessionUserId,
          followingId: user.id,
        },
      },
    });
    isFollowing = !!followRelation;
  }

  // 3. Checar visibilidade
  const canViewProfile =
    user.profileVisibility === ProfileVisibility.PUBLIC ||
    isOwner ||
    (user.profileVisibility === ProfileVisibility.FOLLOWERS_ONLY && isFollowing);

  // --- [CORREÇÃO CRÍTICA] ---
  // Formata o usuário ANTES de checar a visibilidade.
  // Desta forma, o componente ProfilePage SEMPRE recebe um objeto 'user' válido.
  const profileUserData: ProfileUser = {
    ...user,
    followersCount: user._count.followers,
    followingCount: user._count.following,
  };
  // --- [FIM DA CORREÇÃO] ---

  // Valores padrão
  let initialSchedule: ScheduleItemWithMedia[] | null = null;
  let weekRange: { start: string, end: string } | null = null;
  let listCounts: ListCounts = { TO_WATCH: 0, WATCHING: 0, WATCHED: 0, DROPPED: 0 };

  // 4. Se puder ver, busca os dados das listas e cronograma
  if (canViewProfile) {
    const listCountsQuery = prisma.mediaStatus.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: { status: true },
    });

    const weekOptions = { weekStartsOn: 1 as const };
    const startDate = startOfDay(startOfWeek(new Date(), weekOptions));
    const endDate = endOfDay(endOfWeek(new Date(), weekOptions));
    
    const scheduleQuery = prisma.scheduleItem.findMany({
      where: {
        userId: user.id,
        scheduledAt: { gte: startDate, lte: endDate },
      },
      include: { media: true },
      orderBy: [{ scheduledAt: "asc" }, { horario: "asc" }],
    });

    // Roda as queries em paralelo para performance
    const [listCountsRaw, scheduleItems] = await Promise.all([
      listCountsQuery,
      scheduleQuery
    ]);

    // Formata as contagens
    listCountsRaw.forEach(item => {
      if (item.status in listCounts) {
        listCounts[item.status as StatusKey] = item._count.status;
      }
    });
    
    initialSchedule = scheduleItems;
    weekRange = {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd'),
    };
  } 
  
  // 5. Retorna o payload completo
  return {
    user: profileUserData, // Sempre retorna o usuário formatado
    isOwner,
    isFollowing,
    canViewProfile, // A flag que diz ao cliente se ele pode ver o conteúdo
    listCounts,
    initialSchedule,
    weekRange,
  };
}


// --- A Página (Server Component) ---
export default async function UserProfilePage({ params, searchParams }: {
  params: { username: string };
  searchParams: { tab: string };
}) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const sessionUserId = session?.user?.id;
  const username = params.username;
  const activeTab = searchParams.tab === "listas" ? "listas" : "cronograma";

  const data = await getUserProfileData(username, sessionUserId);
  
  // O 'data' nunca será nulo por causa do notFound() dentro da função
  const { 
    user, 
    isOwner, 
    isFollowing, 
    canViewProfile,
    listCounts,
    initialSchedule,
    weekRange
  } = data;

  // --- [CORREÇÃO AQUI] ---
  // As props passadas para <ProfilePage> agora correspondem
  // exatamente ao que o componente espera.
  return (
    <ProfilePage
      user={user} 
      isOwner={isOwner}
      isFollowing={isFollowing}
      canViewProfile={canViewProfile} 
      activeTab={activeTab}
      listCounts={listCounts}
      initialSchedule={initialSchedule}
      initialWeekRange={weekRange}
    />
  );
}