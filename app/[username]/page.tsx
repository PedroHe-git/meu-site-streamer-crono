// app/[username]/page.tsx

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProfilePage from "@/app/components/profile/ProfilePage";
import { ProfileVisibility, Prisma, MovieStatusType, Media, ScheduleItem, User } from "@prisma/client";
import { addDays, startOfWeek, endOfWeek, startOfDay, endOfDay, format } from "date-fns";
import { generateScheduleSummary } from "@/lib/ai"; // <--- IMPORTAR IA

// Cache de 10 minutos
export const revalidate = 86400;

// --- Tipos (Mantidos) ---
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";

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
  
  // 1. Buscar o Usuário (Mantido)
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
    notFound(); 
  }

  // 2. Verificar permissões (Mantido)
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

  // 3. Checar visibilidade (Mantido)
  const canViewProfile =
    user.profileVisibility === ProfileVisibility.PUBLIC ||
    isOwner ||
    (user.profileVisibility === ProfileVisibility.FOLLOWERS_ONLY && isFollowing);

  const profileUserData: ProfileUser = {
    ...user,
    followersCount: user._count.followers,
    followingCount: user._count.following,
  };

  // Valores padrão
  let initialSchedule: ScheduleItemWithMedia[] | null = null;
  let weekRange: { start: string, end: string } | null = null;
  let listCounts: ListCounts = { TO_WATCH: 0, WATCHING: 0, WATCHED: 0, DROPPED: 0 };
  let aiSummary: string | null = null; // <-- [NOVO] Adiciona a variável da IA

  // 4. Se puder ver, busca os dados
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

    // Roda as queries em paralelo
    const [listCountsRaw, scheduleItems] = await Promise.all([
      listCountsQuery,
      scheduleQuery
    ]);

    // Formata as contagens (Mantido)
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
    
    // --- [NOVO] Gerar o resumo da IA ---
    // (A função da IA já tem try/catch, por isso é seguro)
    aiSummary = await generateScheduleSummary(user.username, scheduleItems);
    // --- [FIM DA NOVIDADE] ---

  } 
  
  // 5. Retorna o payload completo
  return {
    user: profileUserData, 
    isOwner,
    isFollowing,
    canViewProfile, 
    listCounts,
    initialSchedule,
    weekRange,
    aiSummary, // <-- [NOVO] Retorna o resumo
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
  
  const { 
    user, 
    isOwner, 
    isFollowing, 
    canViewProfile,
    listCounts,
    initialSchedule,
    weekRange,
    aiSummary // <-- [NOVO] Obtém o resumo
  } = data;

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
      aiSummary={aiSummary} // <-- [NOVO] Passa o resumo para o ProfilePage
    />
  );
}