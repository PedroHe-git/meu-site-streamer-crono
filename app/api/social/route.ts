import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions"; 
import { UserRole } from "@prisma/client";
import { revalidateTag } from "next/cache";

// --- GET: Busca os itens (Público) ---
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform"); 

  try {
    const creator = await prisma.user.findFirst({
      where: { role: UserRole.CREATOR },
    });

    if (!creator) return NextResponse.json([], { status: 404 });

    const items = await prisma.socialItem.findMany({
      where: {
        userId: creator.id,
        platform: platform ? platform.toUpperCase() : undefined
      },
      orderBy: { createdAt: 'desc' }, 
      take: 6 
    });

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar itens" }, { status: 500 });
  }
}

// --- POST: Cria um novo item (Só Creator) ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // 👇 TRAVA DE SEGURANÇA
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

    revalidateTag('social');

    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Erro ao salvar social item:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}

// --- DELETE: Remove um item (Só Creator) ---
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  // 👇 TRAVA DE SEGURANÇA
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