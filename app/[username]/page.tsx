import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import ProfilePage from "@/app/components/profile/ProfilePage";
import { unstable_cache } from "next/cache";
import { ProfileVisibility, UserRole } from "@prisma/client";

// --- 1. Função de Busca Cacheada (A Mágica acontece aqui) ---
// Esta função envolve as queries do Prisma com cache
const getCachedUserProfile = unstable_cache(
  async (username: string) => {
    // Normaliza o username para busca (case insensitive)
    const normalizedUsername = decodeURIComponent(username).toLowerCase();

    // Busca o Usuário Principal
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

    // Busca Listas (Counts)
    const mediaStatuses = await prisma.mediaStatus.findMany({
      where: { userId: user.id }
    });

    const listCounts = {
      TO_WATCH: mediaStatuses.filter(i => i.status === 'TO_WATCH').length,
      WATCHING: mediaStatuses.filter(i => i.status === 'WATCHING').length,
      WATCHED: mediaStatuses.filter(i => i.status === 'WATCHED').length,
      DROPPED: mediaStatuses.filter(i => i.status === 'DROPPED').length,
    };

    // Busca Cronograma (Itens não completados ou recentes)
    // Pegamos um range amplo para o cache ser útil por mais tempo
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const scheduleItems = await prisma.scheduleItem.findMany({
      where: {
        userId: user.id,
        isCompleted: false,
        scheduledAt: {
            gte: today // Apenas futuros e hoje
        }
      },
      include: { media: true },
      orderBy: { scheduledAt: 'asc' },
      take: 50 // Limite razoável para cache
    });

    return {
      user,
      listCounts,
      scheduleItems
    };
  },
  ['user-profile-full-data'], // Chave interna do cache
  { 
    revalidate: 3600, // <-- CACHE DE 1 HORA (O banco descansa por 1h)
    tags: ['user-profile'] // Tag para invalidar manualmente se precisar
  }
);

// --- 2. Componente da Página ---
export default async function UserProfile({ 
  params, 
  searchParams 
}: { 
  params: { username: string },
  searchParams: { tab?: string } 
}) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  // 1. Busca os dados (agora vem do CACHE se disponível)
  const cachedData = await getCachedUserProfile(params.username);

  if (!cachedData || !cachedData.user) {
    notFound();
  }

  const { user, listCounts, scheduleItems } = cachedData;

  // 2. Verificações de Acesso (Lógica em tempo real, pois depende de quem visita)
  const isOwner = sessionUserId === user.id;
  
  // Se for dono, não precisamos ir ao banco ver se segue. Se não for, precisamos checar.
  // Essa query é leve e específica, difícil de cachear genericamente, 
  // mas podemos evitar se não houver sessão.
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

  // Regras de Visibilidade
  const isPublic = user.profileVisibility === ProfileVisibility.PUBLIC;
  const canViewProfile = isOwner || isPublic || (user.profileVisibility === ProfileVisibility.FOLLOWERS_ONLY && isFollowing);

  // Tratamento de dados para o componente Client
  const profileUser = {
    ...user,
    followersCount: user._count.followers,
    followingCount: user._count.following
  };

  // Range da Semana (Para o componente de Cronograma)
  // Calculamos no servidor para garantir consistência
  const today = new Date();
  const startOfWeek = new Date(today);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);

  const formattedWeekRange = {
      start: startOfWeek.toISOString(),
      end: endOfWeek.toISOString()
  };

  // Prepara o Cronograma inicial para a aba
  // Serializamos as datas para passar pro Client Component (Next.js não gosta de Date objects puros)
  const serializedSchedule = scheduleItems.map(item => ({
      ...item,
      scheduledAt: item.scheduledAt, // O componente Client vai converter se precisar, ou passamos string
      // Nota: Se o componente esperar Date, o Next.js Server Components serializa automatico em JSON,
      // mas às vezes reclama. Se der erro, converta para .toISOString().
  }));

  return (
    <ProfilePage 
      user={profileUser}
      isOwner={isOwner}
      isFollowing={isFollowing}
      canViewProfile={canViewProfile}
      activeTab={searchParams.tab as "cronograma" | "listas" | undefined}
      listCounts={listCounts}
      initialSchedule={serializedSchedule}
      initialWeekRange={formattedWeekRange}
      aiSummary={null} // Se tiver resumo de IA no futuro, coloque aqui
    />
  );
}