import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const username = params.username;

  try {
    // 1. Envolve a busca no cache
    const getCachedOverlay = unstable_cache(
      async () => {
        const user = await prisma.user.findFirst({
          where: { username: { equals: username, mode: 'insensitive' } },
        });

        if (!user) return null;

        // Busca o que está assistindo agora (Watching)
        const current = await prisma.mediaStatus.findFirst({
          where: { userId: user.id, status: "WATCHING" },
          include: { media: true },
          orderBy: { updatedAt: "desc" },
        });

        // Busca o próximo da lista (opcional, se você tiver lógica de 'next')
        // const next = ... 

        return { current, next: null };
      },
      [`overlay-data-${username}`], // Chave única
      {
        revalidate: 86400, // Cache "infinito" (até você mudar algo)
        tags: [`overlay-${username.toLowerCase()}`] // Tag para limpar cache
      }
    );

    const data = await getCachedOverlay();

    return NextResponse.json(data || {});
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}