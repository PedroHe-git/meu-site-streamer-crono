import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions"; // Ajuste se seu caminho for diferente
import { UserRole } from "@prisma/client";
import { revalidateTag } from "next/cache";

// GET: Busca todos os patrocinadores
export async function GET() {
  try {
    const sponsors = await prisma.sponsor.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(sponsors);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar patrocinadores" }, { status: 500 });
  }
}

// POST: Cria novo patrocinador (Só Admin)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== UserRole.CREATOR) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, category, imageUrl, linkUrl, description } = body;

    // Pega o ID do usuário logado
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });

    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const newSponsor = await prisma.sponsor.create({
      data: {
        name,
        category,
        imageUrl,
        linkUrl,
        description,
        userId: user.id
      }
    });

    await prisma.sponsor.create({ ... });
    revalidateTag('sponsors'); // Limpa cache de parceiros
    return NextResponse.json(newSponsor);

    return NextResponse.json(newSponsor);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar" }, { status: 500 });
  }
}

// DELETE: Remove patrocinador (Só Admin)
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== UserRole.CREATOR) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID necessário" }, { status: 400 });

    await prisma.sponsor.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }

  await prisma.sponsor.delete({ ... });
    revalidateTag('sponsors');
    return NextResponse.json({ success: true });
}