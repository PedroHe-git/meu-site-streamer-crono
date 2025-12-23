import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  const normalizedUsername = decodeURIComponent(username).toLowerCase();

  try {
    const getCachedOverlayData = unstable_cache(
      async () => {
        const user = await prisma.user.findFirst({
          where: { username: { equals: normalizedUsername, mode: 'insensitive' } },
          select: { id: true }
        });

        if (!user) return null;

        const now = new Date();
        const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);

        const todaysItems = await prisma.scheduleItem.findMany({
          where: {
            userId: user.id,
            scheduledAt: { gte: startOfDay, lte: endOfDay },
            isCompleted: false 
          },
          include: { media: true },
          orderBy: [{ horario: 'asc' }, { scheduledAt: 'asc' }]
        });

        const currentItem = todaysItems.length > 0 ? todaysItems[0] : null;
        const nextItem = todaysItems.length > 1 ? todaysItems[1] : null;

        return { current: currentItem, next: nextItem };
      },
      [`overlay-data-${normalizedUsername}`], 
      {
        revalidate: 86400, 
        tags: [`overlay-${normalizedUsername}`] 
      }
    );

    const data = await getCachedOverlayData();

    if (!data) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(data);

  } catch (error) {
    console.error("[OVERLAY_API]", error);
    return new NextResponse("Erro Interno", { status: 500 });
  }
}