import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions"; 
import { UserRole } from "@prisma/client";
import { revalidateTag, unstable_cache } from "next/cache"; // 👈 Importar unstable_cache

// --- GET: Busca os itens (Agora com Cache Inteligente) ---
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform"); // "YOUTUBE" ou "INSTAGRAM"

  try {
    // Função de busca envolvida em cache
    const getCachedSocialItems = unstable_cache(
      async () => {
        // Busca o ID do criador
        const creator = await prisma.user.findFirst({
          where: { role: UserRole.CREATOR },
        });

        if (!creator) return [];

        return await prisma.socialItem.findMany({
          where: {
            userId: creator.id,
            platform: platform ? platform.toUpperCase() : undefined
          },
          orderBy: { createdAt: 'desc' }, 
          take: 6 
        });
      },
      [`social-items-${platform || 'all'}`], // Chave única do cache
      {
        revalidate: 3600, // Atualiza a cada 1 hora no máximo
        tags: ['social']  // Tag para limpar cache quando adicionar/remover itens
      }
    );

    const items = await getCachedSocialItems();

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar itens" }, { status: 500 });
  }
}

// --- POST: Cria um novo item (Sem Cache - Direto no Banco) ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== UserRole.CREATOR) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { platform, imageUrl, linkUrl, title, subtitle } = body;

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });

    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const newItem = await prisma.socialItem.create({
      data: {
        platform,
        imageUrl,
        linkUrl,
        title,
        subtitle,
        userId: user.id
      }
    });

    // Limpa o cache para mostrar o item novo na hora
    revalidateTag('social');

    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Erro ao salvar social item:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}

// --- DELETE: Remove um item ---
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== UserRole.CREATOR) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID necessário" }, { status: 400 });

    await prisma.socialItem.delete({
      where: { id }
    });

    // Limpa o cache
    revalidateTag('social');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}