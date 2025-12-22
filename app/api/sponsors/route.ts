import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { UserRole } from "@prisma/client";
import { revalidateTag, unstable_cache } from "next/cache"; // 👈 Importar unstable_cache

// ATENÇÃO: Removemos a linha 'export const dynamic = force-dynamic' para permitir o cache.

// --- GET: Busca Patrocinadores (Com Cache Longo) ---
export async function GET() {
  try {
    const getCachedSponsors = unstable_cache(
      async () => {
        return await prisma.sponsor.findMany({
          orderBy: { createdAt: 'desc' }
        });
      },
      ['sponsors-list'], // Chave única
      {
        revalidate: 86400, // 24 Horas de cache (economiza muito banco)
        tags: ['sponsors'] // Tag para invalidar quando você alterar
      }
    );

    const sponsors = await getCachedSponsors();
    
    return NextResponse.json(sponsors);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar patrocinadores" }, { status: 500 });
  }
}

// --- POST: Cria novo patrocinador ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== UserRole.CREATOR) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, category, imageUrl, linkUrl, description } = body;

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

    // Limpa o cache imediatamente
    revalidateTag('sponsors'); 

    return NextResponse.json(newSponsor);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar" }, { status: 500 });
  }
}

// --- DELETE: Remove patrocinador ---
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

    // Limpa o cache
    revalidateTag('sponsors');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}