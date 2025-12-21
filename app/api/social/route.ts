import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions"; 
import { UserRole } from "@prisma/client";
import { revalidateTag } from "next/cache";

// --- GET: Busca os itens para mostrar no site ---
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform"); // "YOUTUBE" ou "INSTAGRAM"

  try {
    // Busca o ID do criador (Dono)
    const creator = await prisma.user.findFirst({
      where: { role: UserRole.CREATOR },
    });

    if (!creator) return NextResponse.json([], { status: 404 });

    const items = await prisma.socialItem.findMany({
      where: {
        userId: creator.id,
        platform: platform ? platform.toUpperCase() : undefined
      },
      orderBy: { createdAt: 'desc' }, // Mais recentes primeiro
      take: 6 // Limite de segurança
    });

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar itens" }, { status: 500 });
  }
}

// --- POST: Cria um novo item (Só Admin/Creator) ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Verifica se quem está tentando salvar é o Criador
  if (!session || session.user.role !== UserRole.CREATOR) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { platform, imageUrl, linkUrl, title, subtitle } = body;

    // Busca o ID do usuário no banco para conectar
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

    revalidateTag('social');

    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Erro ao salvar social item:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}

// --- DELETE: Remove um item (Só Admin/Creator) ---
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

    revalidateTag('social');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}