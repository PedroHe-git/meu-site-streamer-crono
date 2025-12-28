import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Agora recebemos também o totalSeasons para fazer a conta
    const { mediaId, seasonNumber, isCompleted, totalSeasons } = await request.json();

    if (!mediaId || seasonNumber === undefined) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const currentStatus = await prisma.mediaStatus.findFirst({
      where: {
        mediaId: mediaId,
        user: { email: session.user.email },
      },
    });

    if (!currentStatus) {
      return NextResponse.json({ error: "Status not found" }, { status: 404 });
    }

    // 1. Atualiza o JSON de progresso
    const progress = (currentStatus.seasonProgress as Record<string, boolean>) || {};
    progress[seasonNumber.toString()] = isCompleted;

    // 2. Lógica Inteligente de Status
    // Conta quantas temporadas estão marcadas como true
    const watchedCount = Object.values(progress).filter(Boolean).length;
    
    let newStatus = currentStatus.status;

    // Se marcou TUDO e o total de temporadas for válido -> Mover para CONCLUÍDO
    if (totalSeasons && watchedCount >= totalSeasons) {
        newStatus = "WATCHED";
    } 
    // Se tem pelo menos uma assistida mas não todas -> Mover para ASSISTINDO
    // (Isso tira ela de "Planejando" automaticamente quando você começa a ver)
    else if (watchedCount > 0 && watchedCount < (totalSeasons || 999)) {
        newStatus = "WATCHING";
    }

    // 3. Salva no banco
    const updated = await prisma.mediaStatus.update({
      where: { id: currentStatus.id },
      data: {
        seasonProgress: progress,
        status: newStatus, // Atualiza a lista automaticamente
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao salvar temporada:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}