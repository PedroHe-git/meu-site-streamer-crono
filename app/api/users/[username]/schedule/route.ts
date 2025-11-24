import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { ProfileVisibility } from "@prisma/client";
import { addWeeks, startOfWeek, endOfWeek, startOfDay, endOfDay, subHours } from "date-fns";
import { unstable_cache } from "next/cache"; // Importar cache

export const runtime = 'nodejs';
// Removemos revalidate = 0 para permitir cache
// export const revalidate = 0; 

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const session = await getServerSession(authOptions);
  const loggedInUserId = session?.user?.id;
  const { username } = params;
  const { searchParams } = new URL(request.url);
  const weekOffset = parseInt(searchParams.get('weekOffset') || '0');

  try {
    // 1. Validação de Acesso (Cacheada por 5 minutos para segurança/performance)
    // Precisamos saber se o perfil é público ou se o usuário logado segue ele.
    // Essa verificação é leve, mas podemos otimizar.
    
    // Para simplificar e garantir segurança, vamos fazer essa checagem rápida:
    const userProfile = await prisma.user.findFirst({
      where: { 
        username: { equals: decodeURIComponent(username), mode: 'insensitive' } 
      },
      select: { id: true, profileVisibility: true }
    });

    if (!userProfile) {
      return new NextResponse(JSON.stringify({ error: "Utilizador não encontrado" }), { status: 404 });
    }

    const isOwner = loggedInUserId === userProfile.id;
    let isFollowing = false;
    
    if (loggedInUserId && !isOwner) {
      const follow = await prisma.follows.findUnique({
        where: { 
            followerId_followingId: {
                followerId: loggedInUserId, 
                followingId: userProfile.id 
            }
        },
      });
      isFollowing = !!follow;
    }
    
    const canView =
      userProfile.profileVisibility === ProfileVisibility.PUBLIC ||
      isOwner ||
      (userProfile.profileVisibility === ProfileVisibility.FOLLOWERS_ONLY && isFollowing);

    if (!canView) {
      return new NextResponse(JSON.stringify({ error: "Este perfil é privado." }), { status: 403 });
    }

    // 2. Busca do Cronograma Cacheada (AQUI ESTÁ A MÁGICA)
    // Usamos o weekOffset na chave para cachear cada semana individualmente.
    const getCachedSchedule = unstable_cache(
        async (targetUserId: string, offset: number) => {
            // Ajuste de Fuso
            const today = subHours(new Date(), 4);
            const targetDate = addWeeks(today, offset);
            const startDate = startOfDay(startOfWeek(targetDate, { weekStartsOn: 1 }));
            const endDate = endOfDay(endOfWeek(targetDate, { weekStartsOn: 1 }));

            const items = await prisma.scheduleItem.findMany({
                where: {
                    userId: targetUserId,
                    scheduledAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                include: { media: true },
                orderBy: [{ scheduledAt: "asc" }, { horario: "asc" }],
            });

            return {
                items,
                weekStart: startDate.toISOString(),
                weekEnd: endDate.toISOString()
            };
        },
        [`user-schedule-${userProfile.id}-${weekOffset}`], // Chave única por usuário E semana
        {
            revalidate: 3600, // Cache de 1 hora
            // Usamos a tag do perfil do usuário. Assim, se ele adicionar um item (na rota POST),
            // a tag 'user-profile-nome' é revalidada e TODAS as semanas cacheadas são limpas.
            tags: [`user-profile-${username.toLowerCase()}`] 
        }
    );

    const data = await getCachedSchedule(userProfile.id, weekOffset);

    return NextResponse.json(data);

  } catch (error) {
    console.error(`Erro ao buscar cronograma:`, error);
    return new NextResponse(JSON.stringify({ error: "Erro interno" }), { status: 500 });
  }
}