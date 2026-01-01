import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limitParam = searchParams.get("limit") || searchParams.get("pageSize");
  const pageSize = limitParam ? parseInt(limitParam) : 15;
  const searchTerm = searchParams.get("search") || "";
  const username = params.username;

  if (!username) return new NextResponse("Username missing", { status: 400 });

  try {
    const normalizedUsername = decodeURIComponent(username).toLowerCase();
    // Verifica se quem está vendo é o dono
    const isOwner = session?.user?.username?.toLowerCase() === normalizedUsername;

    const getCachedList = unstable_cache(
      async (checkOwner: boolean) => {
        const user = await prisma.user.findFirst({
          where: { username: { equals: normalizedUsername, mode: 'insensitive' } },
          select: { 
              id: true,
              profileVisibility: true, // 👈 Importante trazer a visibilidade
              showWatchingList: true,
              showToWatchList: true,
              showWatchedList: true,
              showDroppedList: true
          }
        });

        if (!user) return null;

        // 👇 BLOQUEIO GERAL: Se for PRIVADO e não for o dono, bloqueia tudo.
        if (user.profileVisibility === 'PRIVATE' && !checkOwner) {
            return { private: true };
        }

        // Verifica Privacidade por Lista (Só aplica se não for o dono)
        if (!checkOwner) {
             if (status === "WATCHING" && !user.showWatchingList) return { private: true };
             if (status === "TO_WATCH" && !user.showToWatchList) return { private: true };
             if (status === "WATCHED" && !user.showWatchedList) return { private: true };
             if (status === "DROPPED" && !user.showDroppedList) return { private: true };
        }

        let whereClause: any = { userId: user.id };
        
        if (status === "WATCHED") {
            whereClause.OR = [
                { status: 'WATCHED' },
                { status: 'WATCHING', lastSeasonWatched: { gt: 0 } }
            ];
        } else if (status && status !== "ALL") {
            whereClause.status = status;
        }

        if (searchTerm) {
            const searchFilter = { media: { title: { contains: searchTerm, mode: 'insensitive' } } };
            if (whereClause.OR) {
                whereClause.AND = [ searchFilter, { OR: whereClause.OR } ];
                delete whereClause.OR;
            } else {
                whereClause.media = searchFilter.media;
            }
        }

        const [items, total] = await Promise.all([
          prisma.mediaStatus.findMany({
            where: whereClause,
            include: { 
                media: {
                    select: {
                        id: true, title: true, posterPath: true, mediaType: true,
                        totalSeasons: true, tmdbId: true, malId: true, igdbId: true
                    }
                } 
            }, 
            orderBy: { updatedAt: "desc" },
            take: pageSize,
            skip: (page - 1) * pageSize,
          }),
          prisma.mediaStatus.count({ where: whereClause })
        ]);

        return { items, total, totalPages: Math.ceil(total / pageSize) };
      },
      // Atualizamos a chave do cache
      [`lists-v5-${normalizedUsername}-${status}-${page}-${pageSize}-${searchTerm}-${isOwner}`], 
      {
        revalidate: 3600,
        tags: [`user-profile-${normalizedUsername}`]
      }
    );

    const data = await getCachedList(isOwner);

    if (!data) return new NextResponse("User not found", { status: 404 });
    
    // Retorna array vazio se for privado
    if (data.private) return NextResponse.json({ items: [], total: 0, totalPages: 0, isPrivate: true });

    return NextResponse.json(data);

  } catch (error) {
    return new NextResponse("Erro Interno", { status: 500 });
  }
}