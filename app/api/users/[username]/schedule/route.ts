import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { ProfileVisibility } from "@prisma/client";
import { addWeeks, startOfWeek, endOfWeek, startOfDay, endOfDay, subHours } from "date-fns";
import { unstable_cache } from "next/cache"; 

export const runtime = 'nodejs';

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
    const normalizedUsername = decodeURIComponent(username).toLowerCase();

    // --- CACHE 1: Validação de Permissão de Acesso (1 hora ou até revalidação) ---
    // Esta função verifica se o perfil existe, suas configs de privacidade e se o usuário logado o segue.
    // Chave de cache: depende do perfil visitado E de quem está visitando.
    const getCachedAccess = unstable_cache(
      async (visitorId: string | undefined) => {
        const userProfile = await prisma.user.findFirst({
          where: { 
            username: { equals: normalizedUsername, mode: 'insensitive' } 
          },
          select: { id: true, profileVisibility: true }
        });

        if (!userProfile) return null;

        const isOwner = visitorId === userProfile.id;
        let isFollowing = false;

        if (visitorId && !isOwner) {
          const follow = await prisma.follows.findUnique({
            where: { 
                followerId_followingId: {
                    followerId: visitorId, 
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

        return { 
            exists: true, 
            canView, 
            profileId: userProfile.id,
            isOwner // Retornamos para uso interno se precisar
        };
      },
      [`access-check-${normalizedUsername}-${loggedInUserId || 'public'}`], 
      {
        revalidate: 3600, 
        // Tags importantes: 
        // - user-profile-[username]: se o dono mudar a visibilidade, invalida.
        // - user-follows-[visitorId]: se o visitante seguir/deixar de seguir, invalida.
        tags: [
            `user-profile-${normalizedUsername}`, 
            loggedInUserId ? `user-follows-${loggedInUserId}` : 'public-access'
        ]
      }
    );

    const accessData = await getCachedAccess(loggedInUserId);

    if (!accessData) {
      return new NextResponse(JSON.stringify({ error: "Utilizador não encontrado" }), { status: 404 });
    }

    if (!accessData.canView) {
      return new NextResponse(JSON.stringify({ error: "Este perfil é privado." }), { status: 403 });
    }

    // --- CACHE 2: Busca do Cronograma (Já implementado, mantido) ---
    const getCachedSchedule = unstable_cache(
        async (targetUserId: string, offset: number) => {
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
        [`user-schedule-${accessData.profileId}-${weekOffset}`], 
        {
            revalidate: 3600, 
            tags: [`user-profile-${normalizedUsername}`] 
        }
    );

    const data = await getCachedSchedule(accessData.profileId, weekOffset);

    return NextResponse.json(data);

  } catch (error) {
    console.error(`Erro ao buscar cronograma:`, error);
    return new NextResponse(JSON.stringify({ error: "Erro interno" }), { status: 500 });
  }
}