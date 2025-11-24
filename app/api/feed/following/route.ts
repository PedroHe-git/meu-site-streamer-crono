import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { unstable_cache } from "next/cache";

// Remove force-dynamic
// export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const userId = session.user.id;

  try {
    // Cacheia o feed de 'following' por usuário por 1 hora (ou até revalidação)
    const getCachedFollowing = unstable_cache(
      async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const creators = await prisma.user.findMany({
          where: {
            followers: {
              some: { followerId: userId } // Que eu sigo
            },
            scheduleItems: {
              some: {
                scheduledAt: { gte: today, lte: nextWeek },
                isCompleted: false
              }
            }
          },
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            twitchUsername: true,
            scheduleItems: {
                where: {
                    scheduledAt: { gte: today, lte: nextWeek },
                    isCompleted: false
                },
                select: { id: true }
            }
          }
        });

        return creators.map(user => ({
            id: user.id,
            username: user.username,
            name: user.name,
            image: user.image,
            twitchUsername: user.twitchUsername,
            itemCount: user.scheduleItems.length
        }));
      },
      [`following-feed-${userId}`], 
      { 
        revalidate: 3600, 
        tags: [`following-feed-${userId}`] 
      }
    );

    const formattedCreators = await getCachedFollowing();

    return NextResponse.json(formattedCreators);
  } catch (error) {
    console.error(error);
    return new NextResponse("Erro", { status: 500 });
  }
}