import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import ProfilePage from "@/app/components/profile/ProfilePage";
import { unstable_cache } from "next/cache";
import { ProfileVisibility, UserRole } from "@prisma/client";
import { startOfWeek, endOfWeek, addDays, startOfDay, endOfDay, subHours } from "date-fns";

// Cache de 1 hora para o perfil público
const getCachedUserProfile = async (username: string) => {
  const normalizedUsername = decodeURIComponent(username).toLowerCase();

  const getProfileData = unstable_cache(
    async () => {
      const user = await prisma.user.findFirst({
        where: { 
          username: {
             equals: normalizedUsername,
             mode: 'insensitive' 
          }
        },
        include: {
          _count: {
            select: { followers: true, following: true }
          }
        }
      });

      if (!user) return null;

      const mediaStatuses = await prisma.mediaStatus.findMany({
        where: { userId: user.id }
      });

      const listCounts = {
        TO_WATCH: mediaStatuses.filter(i => i.status === 'TO_WATCH').length,
        WATCHING: mediaStatuses.filter(i => i.status === 'WATCHING').length,
        WATCHED: mediaStatuses.filter(i => i.status === 'WATCHED').length,
        DROPPED: mediaStatuses.filter(i => i.status === 'DROPPED').length,
      };

      // --- CORREÇÃO DE FUSO HORÁRIO (UTC -> Local) ---
      // Subtraímos 4 horas do horário do servidor (UTC) para garantir que 
      // "Domingo à noite" no Brasil ainda seja Domingo, e não Segunda de manhã.
      const today = subHours(new Date(), 4);
      
      const startOfCurrentWeek = startOfDay(startOfWeek(today, { weekStartsOn: 1 }));
      const futureLimit = endOfDay(addDays(startOfCurrentWeek, 28)); // Aumentei para 4 semanas
      
      const scheduleItems = await prisma.scheduleItem.findMany({
        where: {
          userId: user.id,
          // REMOVIDO: isCompleted: false 
          // Agora mostramos itens concluídos também, para manter o histórico da semana visível
          scheduledAt: { 
              gte: startOfCurrentWeek,
              lte: futureLimit
          }
        },
        include: { media: true },
        orderBy: { scheduledAt: 'asc' },
        take: 200
      });

      return { user, listCounts, scheduleItems };
    },
    [`user-profile-${normalizedUsername}`], 
    { revalidate: 3600, tags: [`user-profile-${normalizedUsername}`, 'user-profile'] } 
  );

  return getProfileData();
};

export default async function UserProfile({ 
  params, 
  searchParams 
}: { 
  params: { username: string },
  searchParams: { tab?: string } 
}) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  const cachedData = await getCachedUserProfile(params.username);

  if (!cachedData || !cachedData.user) {
    notFound();
  }

  const { user, listCounts, scheduleItems } = cachedData;

  const isOwner = sessionUserId === user.id;
  
  let isFollowing = false;
  if (sessionUserId && !isOwner) {
      const followCheck = await prisma.follows.findUnique({
          where: {
              followerId_followingId: {
                  followerId: sessionUserId,
                  followingId: user.id
              }
          }
      });
      isFollowing = !!followCheck;
  }

  const isPublic = user.profileVisibility === ProfileVisibility.PUBLIC;
  const canViewProfile = isOwner || isPublic || (user.profileVisibility === ProfileVisibility.FOLLOWERS_ONLY && isFollowing);

  const profileUser = {
    ...user,
    followersCount: user._count.followers,
    followingCount: user._count.following
  };

  // --- CORREÇÃO NO RENDERIZADOR TAMBÉM ---
  const today = subHours(new Date(), 4); // Ajuste de fuso aqui também
  const currentWeekStart = startOfDay(startOfWeek(today, { weekStartsOn: 1 }));
  const currentWeekEnd = endOfDay(endOfWeek(today, { weekStartsOn: 1 }));

  const formattedWeekRange = {
      start: currentWeekStart.toISOString(),
      end: currentWeekEnd.toISOString()
  };

  const serializedSchedule = scheduleItems.map(item => {
      let dateString: string;
      if (item.scheduledAt instanceof Date && !isNaN(item.scheduledAt.getTime())) {
          dateString = item.scheduledAt.toISOString();
      } else if (typeof item.scheduledAt === 'string') {
          dateString = item.scheduledAt;
      } else {
          dateString = new Date().toISOString(); 
      }

      return {
          ...item,
          scheduledAt: dateString,
      };
  });

  return (
    <ProfilePage 
      user={profileUser}
      isOwner={isOwner}
      isFollowing={isFollowing}
      canViewProfile={canViewProfile}
      activeTab={searchParams.tab as "cronograma" | "listas" | undefined}
      listCounts={listCounts}
      // @ts-ignore
      initialSchedule={serializedSchedule}
      initialWeekRange={formattedWeekRange}
      aiSummary={null} 
    />
  );
}