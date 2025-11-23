import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { revalidateTag } from "next/cache"; // <--- IMPORTANTE: Importe a função de revalidação

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const listType = searchParams.get("list"); // 'pending' ou 'completed'

  const userId = session.user.id;

  try {
    const scheduleItems = await prisma.scheduleItem.findMany({
      where: {
        userId: userId,
        ...(listType === 'pending' ? { isCompleted: false } : {}),
        ...(listType === 'completed' ? { isCompleted: true } : {}),
      },
      include: {
        media: true,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return NextResponse.json(scheduleItems);
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return new NextResponse("Erro Interno", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  try {
    const body = await request.json();
    const { mediaId, scheduledAt, horario, seasonNumber, episodeNumber, episodeNumberEnd } = body;
    const userId = session.user.id;

    if (!mediaId || !scheduledAt) {
      return new NextResponse("Dados inválidos", { status: 400 });
    }

    // Cria o item no banco
    const newScheduleItem = await prisma.scheduleItem.create({
      data: {
        userId: userId,
        mediaId: mediaId,
        scheduledAt: new Date(scheduledAt),
        horario: horario || null,
        seasonNumber: seasonNumber ? parseInt(seasonNumber) : null,
        episodeNumber: episodeNumber ? parseInt(episodeNumber) : null,
        episodeNumberEnd: episodeNumberEnd ? parseInt(episodeNumberEnd) : null,
        isCompleted: false,
      },
      include: { // Inclui a mídia para o retorno
        media: true,
      }
    });

    // --- A LINHA MÁGICA DE REVALIDAÇÃO ---
    // Isso invalida o cache da página de perfil público, forçando uma atualização na próxima visita.
    // A tag 'user-profile' deve ser a mesma usada no unstable_cache em app/[username]/page.tsx
    revalidateTag('user-profile'); 
    // -------------------------------------

    return NextResponse.json(newScheduleItem);

  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return new NextResponse("Erro Interno", { status: 500 });
  }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
  
    if (!session?.user?.id) {
      return new NextResponse("Não autorizado", { status: 401 });
    }
  
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
  
    if (!id) {
        return new NextResponse("ID faltando", { status: 400 });
    }
  
    try {
      await prisma.scheduleItem.delete({
        where: {
            id: id,
            userId: session.user.id // Garante que só apaga o seu próprio item
        }
      });

      // --- REVALIDAÇÃO TAMBÉM NA DELEÇÃO ---
      revalidateTag('user-profile');
      // -------------------------------------
  
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Erro ao apagar agendamento:", error);
      return new NextResponse("Erro Interno", { status: 500 });
    }
}