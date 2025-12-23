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
  
  // 👇 Permite que o frontend defina o limite (ex: 2000), com padrão 15
  const limitParam = searchParams.get("limit") || searchParams.get("pageSize");
  const pageSize = limitParam ? parseInt(limitParam) : 15;
  
  // 👇 Pega o termo de busca (opcional, para uso futuro ou se mudar para busca no server)
  const searchTerm = searchParams.get("search") || "";

  const username = params.username;
  if (!username) return new NextResponse("Username missing", { status: 400 });

  try {
    const normalizedUsername = decodeURIComponent(username).toLowerCase();

    const getCachedList = unstable_cache(
      async () => {
        const user = await prisma.user.findFirst({
          where: { username: { equals: normalizedUsername, mode: 'insensitive' } },
          select: { id: true }
        });

        if (!user) return null;

        const whereClause: any = {
            userId: user.id
        };
        
        if (status && status !== "ALL") {
            whereClause.status = status;
        }

        // Adiciona suporte a busca no banco (caso o front passe ?search=...)
        if (searchTerm) {
            whereClause.media = {
                title: { contains: searchTerm, mode: 'insensitive' }
            };
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
      // 👇 Chave de Cache atualizada com pageSize e searchTerm
      [`lists-${normalizedUsername}-${status}-${page}-${pageSize}-${searchTerm}`], 
      {
        revalidate: 3600,
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