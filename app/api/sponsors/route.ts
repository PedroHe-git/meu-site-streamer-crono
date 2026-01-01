import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { UserRole } from "@prisma/client";
import { revalidateTag } from "next/cache";

// GET: Retorna TODOS os patrocinadores (ativos e inativos) para o Dashboard
export async function GET() {
  try {
    const sponsors = await prisma.sponsor.findMany({
      orderBy: [
        { isActive: 'desc' }, // Ativos aparecem primeiro
        { createdAt: 'desc' }
      ]
    });
    return NextResponse.json(sponsors);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar patrocinadores" }, { status: 500 });
  }
}

// POST: Cria novo patrocinador (Padrão: Ativo)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== UserRole.CREATOR) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, category, imageUrl, linkUrl, description, isActive } = body;

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const newSponsor = await prisma.sponsor.create({
      data: {
        name,
        category,
        imageUrl,
        linkUrl,
        description,
        isActive: isActive !== undefined ? isActive : true, // Se não vier nada, é true
        userId: user.id
      }
    });

    revalidateTag('sponsors'); 
    return NextResponse.json(newSponsor);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar" }, { status: 500 });
  }
}

// PUT: Atualiza o status (Ativo/Inativo)
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== UserRole.CREATOR) return NextResponse.json({}, { status: 403 });

  try {
    const body = await request.json();
    const { id, isActive } = body;

    const updated = await prisma.sponsor.update({
      where: { id },
      data: { isActive }
    });

    revalidateTag('sponsors');
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE: Remove patrocinador
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== UserRole.CREATOR) return NextResponse.json({}, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID necessário" }, { status: 400 });

    await prisma.sponsor.delete({ where: { id } });
    revalidateTag('sponsors');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}