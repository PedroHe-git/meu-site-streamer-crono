import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import ProfilePage from "@/app/components/profile/ProfilePage";
import { unstable_cache } from "next/cache";
import { ProfileVisibility, UserRole } from "@prisma/client";
import { startOfWeek, endOfWeek, addDays } from "date-fns";

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
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    const futureLimit = addDays(startOfCurrentWeek, 21); 
    
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

  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const formattedWeekRange = {
      start: currentWeekStart.toISOString(),
      end: currentWeekEnd.toISOString()
  };

  // --- CORREÇÃO DE DATA SEGURA ---
  const serializedSchedule = scheduleItems.map(item => {
      let dateString: string;
      
      // Verifica se já é um objeto Date válido
      if (item.scheduledAt instanceof Date && !isNaN(item.scheduledAt.getTime())) {
          dateString = item.scheduledAt.toISOString();
      } 
      // Se já for string, usa direto
      else if (typeof item.scheduledAt === 'string') {
          dateString = item.scheduledAt;
      } 
      // Fallback de segurança para evitar crash
      else {
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
      // @ts-ignore: O componente cliente tratará a string
      initialSchedule={serializedSchedule}
      initialWeekRange={formattedWeekRange}
      aiSummary={null} 
    />
  );
}