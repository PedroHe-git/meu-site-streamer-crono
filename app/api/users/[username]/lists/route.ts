import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 15; // Tamanho da paginação pública

  const username = params.username;
  if (!username) return new NextResponse("Username missing", { status: 400 });

  try {
    // Normaliza para minúsculo para bater com a tag de invalidação do dashboard
    const normalizedUsername = decodeURIComponent(username).toLowerCase();

    const getCachedList = unstable_cache(
      async () => {
        const user = await prisma.user.findFirst({
          where: { username: { equals: normalizedUsername, mode: 'insensitive' } },
          select: { id: true }
        });

        if (!user) return null;

        // Se status for "ALL" ou vazio, pegamos tudo, senão aplica filtro
        const whereClause: any = {
            userId: user.id
        };
        
        if (status && status !== "ALL") {
            whereClause.status = status;
        }

        const [items, total] = await Promise.all([
          prisma.mediaStatus.findMany({
            where: whereClause,
            include: { media: true },
            orderBy: { updatedAt: "desc" },
            take: pageSize,
            skip: (page - 1) * pageSize,
          }),
          prisma.mediaStatus.count({ where: whereClause })
        ]);

        return { items, total, totalPages: Math.ceil(total / pageSize) };
      },
      // Chave única de cache para essa combinação de dados
      [`lists-${normalizedUsername}-${status}-${page}`], 
      {
        revalidate: 3600, // Cache de 1 hora por padrão
        // 🛑 CORREÇÃO CRÍTICA: 
        // Usamos a mesma tag que o POST/PUT/DELETE limpam no 'mediastatus/route.ts'
        tags: [`user-profile-${normalizedUsername}`]
      }
    );

    const data = await getCachedList();

    if (!data) return new NextResponse("User not found", { status: 404 });

    return NextResponse.json(data);

  } catch (error) {
    console.error("Erro na API de listas públicas:", error);
    return new NextResponse("Erro Interno", { status: 500 });
  }
}