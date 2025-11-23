import { NextResponse } from "next/server";
// --- [IMPORTANTE] Usa imports do Next-Auth v4 ---
import { getServerSession } from "next-auth/next";
// --- [CORREÇÃO AQUI - Usa Alias] ---
import { authOptions } from "@/lib/authOptions";
// --- [FIM CORREÇÃO] ---
import prisma from '@/lib/prisma';
import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache"; // Importação necessária para o cache on-demand

export const runtime = 'nodejs';


export async function POST(request: Request) {
  const session = await getServerSession(authOptions); // Usa authOptions v4 importado corretamente
  if (!session?.user?.email) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return new NextResponse("Usuário não encontrado", { status: 404 });
    }

    const body = await request.json();
    const { scheduleItemId } = body;

    if (!scheduleItemId) {
      return new NextResponse(JSON.stringify({ error: "ID do agendamento faltando" }), { status: 400 });
    }

    // Transação para garantir consistência
    const result = await prisma.$transaction(async (tx) => {

      // 1. Encontra o agendamento E o status da mídia associada
      const scheduleItem = await tx.scheduleItem.findUnique({
        where: { id: scheduleItemId, userId: user.id, },
        include: {
           media: {
             include: {
               // Puxa o MediaStatus específico deste utilizador para esta mídia
               mediaStatuses: { where: { userId: user.id } }
             }
           }
        }
      });
      if (!scheduleItem) { throw new Error("Item de agendamento não encontrado."); }

      const mediaStatus = scheduleItem.media.mediaStatuses[0];
      if (!mediaStatus) { throw new Error("Status da mídia correspondente não encontrado."); }

      // 2. Prepara os dados para atualizar o MediaStatus
      const mediaStatusUpdateData: Prisma.MediaStatusUpdateInput = {
          // Atualiza o progresso SEMPRE
          lastSeasonWatched: scheduleItem.seasonNumber,
          lastEpisodeWatched: scheduleItem.episodeNumber,
          lastEpisodeWatchedEnd: scheduleItem.episodeNumberEnd,
      };

      // 3. Decide o NOVO status baseado em isWeekly
      if (mediaStatus.isWeekly) {
         // Se for semanal, o status NÃO MUDA (continua WATCHING)
         mediaStatusUpdateData.status = "WATCHING";
      } else {
         // Se NÃO for semanal, muda para WATCHED
         mediaStatusUpdateData.status = "WATCHED";
         mediaStatusUpdateData.watchedAt = new Date();
      }

      // 4. Atualiza o MediaStatus
      const updatedMediaStatus = await tx.mediaStatus.update({
        where: { id: mediaStatus.id }, // Usa o ID do MediaStatus encontrado
        data: mediaStatusUpdateData,
      });

      // 5. Atualiza o ScheduleItem para concluído
      await tx.scheduleItem.update({
        where: { id: scheduleItem.id, },
        data: { isCompleted: true } // Em vez de deletar, marcamos como completo
      });

      console.log(`Item ${mediaStatus.isWeekly ? 'semanal' : 'normal'} (${scheduleItem.id}) concluído.`);
      
      // --- [MUDANÇA AQUI] ---
      // Retornamos 'isWeekly' para o frontend saber qual mensagem mostrar.
      return { updatedMediaStatus, itemWasCompleted: true, isWeekly: mediaStatus.isWeekly };
    });

    // --- REVALIDAÇÃO DE CACHE ---
    // Limpa o cache do perfil público para refletir a conclusão imediatamente
    if (user.username) {
       const tag = `user-profile-${user.username.toLowerCase()}`;
       revalidateTag(tag);
       console.log(`Cache revalidado (COMPLETE) para: ${tag}`);
    }

    // Retorna o resultado da transação
    return NextResponse.json(result);

  } catch (error) {
     console.error("Erro ao completar item:", error);
     // Trata erros específicos (ex: item não encontrado)
     if (error instanceof Error && (error.message.includes("não encontrado") || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'))) {
        return new NextResponse(JSON.stringify({ error: "Erro: Item de agendamento ou status não encontrado." }), { status: 404 });
     }
    // Erro genérico
    return new NextResponse(JSON.stringify({ error: "Erro interno ao completar item" }), { status: 500 });
  }
}