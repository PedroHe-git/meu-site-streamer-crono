import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import ProfilePage from "@/app/components/profile/ProfilePage";
import { unstable_cache } from "next/cache";
import { ProfileVisibility, UserRole } from "@prisma/client";
import { startOfWeek, endOfWeek, addDays, startOfDay, endOfDay } from "date-fns"; // Importei startOfDay e endOfDay

// Cache de 1 hora para o perfil público
const getCachedUserProfile = unstable_cache(
  async (username: string) => {
    const normalizedUsername = decodeURIComponent(username).toLowerCase();

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

    const today = new Date();
    
    // --- CORREÇÃO DE DATAS NO CACHE ---
    // Força o início da semana na Segunda-feira (1) e zera o horário
    const startOfCurrentWeek = startOfDay(startOfWeek(today, { weekStartsOn: 1 }));
    
    // Define um limite futuro seguro (3 semanas)
    const futureLimit = endOfDay(addDays(startOfCurrentWeek, 21)); 
    
    const scheduleItems = await prisma.scheduleItem.findMany({
      where: {
        userId: user.id,
        isCompleted: false,
        scheduledAt: { 
            gte: startOfCurrentWeek,
            lte: futureLimit
        }
      },
      include: { media: true },
      orderBy: { scheduledAt: 'asc' },
      take: 100
    });

    return { user, listCounts, scheduleItems };
  },
  ['user-profile-full-data'], 
  { revalidate: 3600, tags: ['user-profile'] } 
);

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

  // --- CORREÇÃO DE DATAS NO RENDER ---
  const today = new Date();
  // Garante que o range inicial enviado pro front seja EXATAMENTE Segunda 00:00 a Domingo 23:59
  const currentWeekStart = startOfDay(startOfWeek(today, { weekStartsOn: 1 }));
  const currentWeekEnd = endOfDay(endOfWeek(today, { weekStartsOn: 1 }));

  const formattedWeekRange = {
      start: currentWeekStart.toISOString(),
      end: currentWeekEnd.toISOString()
  };

  // Serialização segura das datas
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