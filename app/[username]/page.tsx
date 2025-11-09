// app/[username]/page.tsx (Corrigido com contagem de listas)

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProfilePage from "@/app/components/profile/ProfilePage"; 
import { ProfileVisibility, Prisma, MovieStatusType } from "@prisma/client"; // Importa Prisma e Enums

// Tipos
type PageProps = {
  params: { username: string };
  searchParams: { tab: string };
};
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED"; // Tipo para as contagens

// Esta função busca os dados no servidor
async function getUserProfileData(username: string, sessionUserId: string | undefined) {
  
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

  // --- [INÍCIO DA MUDANÇA] ---
  // 1. Buscar as contagens de todas as listas de uma só vez
  const listCountsRaw = await prisma.mediaStatus.groupBy({
    by: ['status'],
    where: {
      userId: user.id,
    },
    _count: {
      status: true,
    },
  });

  // 2. Formatar as contagens num objeto fácil de usar
  const listCounts = {
    TO_WATCH: 0,
    WATCHING: 0,
    WATCHED: 0,
    DROPPED: 0,
  };

  listCountsRaw.forEach(item => {
    if (item.status in listCounts) {
      listCounts[item.status as StatusKey] = item._count.status;
    }
  });
  // --- [FIM DA MUDANÇA] ---


  let isFollowing = false;
  let isOwner = false;

  if (sessionUserId) {
    isOwner = user.id === sessionUserId;
    if (!isOwner) {
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
  }

  const canViewProfile =
    user.profileVisibility === ProfileVisibility.PUBLIC ||
    isOwner ||
    (user.profileVisibility === ProfileVisibility.FOLLOWERS_ONLY && isFollowing);

  // Formata os dados para o componente ProfilePage
  const profileUserData = {
    id: user.id,
    username: user.username,
    name: user.name,
    image: user.image,
    bio: user.bio,
    profileBannerUrl: user.profileBannerUrl, 
    role: user.role,
    twitchUsername: user.twitchUsername,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    isPrivate: user.profileVisibility === "FOLLOWERS_ONLY", 
    profileVisibility: user.profileVisibility, 
    showToWatchList: user.showToWatchList,
    showWatchingList: user.showWatchingList,
    showWatchedList: user.showWatchedList,
    showDroppedList: user.showDroppedList,
    listCounts: listCounts, // <-- [NOVO] 3. Passa as contagens
  };

  return {
    user: profileUserData,
    isOwner,
    isFollowing,
    canViewProfile,
  };
}


// --- A Página ---
export default async function UserProfilePage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const sessionUserId = session?.user?.id;
  const username = params.username;
  const activeTab = searchParams.tab === "listas" ? "listas" : "cronograma";

  const { user, isOwner, isFollowing, canViewProfile } = await getUserProfileData(username, sessionUserId);

  return (
    <ProfilePage
      user={user}
      isOwner={isOwner}
      isFollowing={isFollowing}
      canViewProfile={canViewProfile}
      activeTab={activeTab}
    />
  );
}