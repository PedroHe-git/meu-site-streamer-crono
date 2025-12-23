import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 12; // Mesmo tamanho da paginação do front

  const username = params.username;
  if (!username) return new NextResponse("Username missing", { status: 400 });

  try {
    const getCachedList = unstable_cache(
      async () => {
        const user = await prisma.user.findFirst({
          where: { username: { equals: username, mode: 'insensitive' } },
          select: { id: true }
        });

        if (!user) return null;

        // Se status for "ALL" ou vazio, pegamos tudo (ou filtre conforme sua lógica)
        const whereClause = {
            userId: user.id,
            ...(status && status !== "ALL" ? { status: status as any } : {})
        };

        const [items, total] = await Promise.all([
          prisma.mediaStatus.findMany({
            where: whereClause,
            include: { media: true },
            orderBy: { updatedAt: "desc" }, // Ou watchedAt
            take: pageSize,
            skip: (page - 1) * pageSize,
          }),
          prisma.mediaStatus.count({ where: whereClause })
        ]);

        return { items, total, totalPages: Math.ceil(total / pageSize) };
      },
      [`lists-${username}-${status}-${page}`], // Chave única por página/status
      {
        revalidate: 3600, // Cache de 1 hora
        tags: [`list-${username}`]
      }
    );

    const data = await getCachedList();

    if (!data) return new NextResponse("User not found", { status: 404 });

    return NextResponse.json(data);

  } catch (error) {
    console.error("Erro na API de listas:", error);
    return new NextResponse("Erro Interno", { status: 500 });
  }
}