import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const { searchParams } = new URL(request.url);
  
  // Parâmetros da URL
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const search = searchParams.get("search") || ""; // <--- NOVO: Captura a busca

  // Validação básica
  if (!status || !["TO_WATCH", "WATCHING", "WATCHED", "DROPPED"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  try {
    // 1. Achar o ID do usuário pelo username
    const user = await prisma.user.findFirst({
      where: { 
        username: {
          equals: params.username,
          mode: 'insensitive'
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // 2. Montar o filtro (Where)
    const whereCondition = {
      userId: user.id,
      status: status as any,
      // Se tiver busca, filtra pelo título da mídia
      ...(search ? {
        media: {
          title: {
            contains: search,
            mode: 'insensitive' as const, // Ignora maiúsculas/minúsculas
          }
        }
      } : {})
    };

    // 3. Contar total de itens (para paginação)
    const totalItems = await prisma.mediaStatus.count({
      where: whereCondition
    });

    // 4. Buscar os itens paginados
    const items = await prisma.mediaStatus.findMany({
      where: whereCondition,
      include: {
        media: true, // Inclui dados do filme/jogo
      },
      orderBy: {
        // Ordena por data de conclusão (se tiver) ou atualização
        watchedAt: 'desc', 
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      items,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    });

  } catch (error) {
    console.error("Erro na API de listas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}