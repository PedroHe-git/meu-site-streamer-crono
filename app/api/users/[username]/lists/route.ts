import { NextResponse, NextRequest } from "next/server";
import prisma from '@/lib/prisma';
import { Prisma } from "@prisma/client";

export const runtime = 'nodejs';

// Define os tipos de status válidos
const validStatuses = ["TO_WATCH", "WATCHING", "WATCHED", "DROPPED"];

// GET /api/users/{username}/lists?status=TO_WATCH&page=1&pageSize=20&searchTerm=...
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  if (!username) {
    return new NextResponse(JSON.stringify({ error: "Username é obrigatório" }), { status: 400 });
  }

  try {
    // Encontra o utilizador pelo username
    const user = await prisma.user.findUnique({
      where: { username: decodeURIComponent(username) },
      select: { id: true } // Seleciona apenas o ID por segurança e performance
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Utilizador não encontrado" }), { status: 404 });
    }

    // Lê os parâmetros da URL
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const statusParam = searchParams.get('status');
    const searchTerm = searchParams.get('searchTerm');

    // Valida o status
    if (!statusParam || !validStatuses.includes(statusParam)) {
       return new NextResponse(JSON.stringify({ error: "Status inválido ou não especificado" }), { status: 400 });
    }
    const statusFilter = statusParam as Prisma.EnumMovieStatusTypeFilter['equals'];

    // Define paginação
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 20; // Padrão
    const skip = (page - 1) * pageSize;

    // Condição de busca (WHERE)
    const whereCondition: Prisma.MediaStatusWhereInput = {
      userId: user.id,
      status: statusFilter,
    };
    if (searchTerm) {
      whereCondition.media = {
        title: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      };
    }

    // Busca Paginada e Contagem Total
    const [items, totalCount] = await Promise.all([
      prisma.mediaStatus.findMany({
        where: whereCondition,
        include: { media: true }, // Inclui a média para mostrar detalhes
        skip: skip,
        take: pageSize,
        orderBy: { media: { title: 'asc' } }
      }),
      prisma.mediaStatus.count({
        where: whereCondition,
      })
    ]);

    return NextResponse.json({
      items,
      totalCount,
      page,
      pageSize
    });

  } catch (error) {
    console.error(`Erro ao buscar lista pública para ${username}:`, error);
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor" }), { status: 500 });
  }
}
