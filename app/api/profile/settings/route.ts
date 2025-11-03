// app/api/profile/settings/route.ts (Atualizado)

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from '@/lib/prisma';
import { Prisma, UserRole, ProfileVisibility } from "@prisma/client"; 

export const runtime = 'nodejs';
export const revalidate = 0; // Força a API a ser dinâmica

// --- PUT: Atualiza as definições do perfil ---
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  // @ts-ignore
  const userId = session?.user?.id as string | undefined;
  // @ts-ignore
  const userRole = session?.user?.role as UserRole | undefined;

  if (!userId) { return new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }); }
  if (userRole !== UserRole.CREATOR) { return new NextResponse(JSON.stringify({ error: "Acesso negado." }), { status: 403 }); }

  try {
    const body = await request.json();
    
    // --- [MUDANÇA 1: Receber novos campos] ---
    const { 
      bio, 
      profileVisibility,
      showToWatchList,
      showWatchingList,
      showWatchedList,
      showDroppedList
    } = body; 

    // --- Validações ---
    if (bio !== undefined && typeof bio !== 'string') {
        return new NextResponse(JSON.stringify({ error: "Biografia inválida." }), { status: 400 });
    }
    if (bio && bio.length > 200) {
         return new NextResponse(JSON.stringify({ error: "Biografia excede 200 caracteres." }), { status: 400 });
    }
    if (profileVisibility !== undefined && !['PUBLIC', 'FOLLOWERS_ONLY'].includes(profileVisibility)) {
      return new NextResponse(JSON.stringify({ error: "Visibilidade inválida." }), { status: 400 });
    }
    // --- Fim Validações ---

    const dataToUpdate: Prisma.UserUpdateInput = {};
    
    // Adiciona apenas os campos que foram enviados
    if (bio !== undefined) dataToUpdate.bio = bio;
    if (profileVisibility !== undefined) dataToUpdate.profileVisibility = profileVisibility;
    // --- [MUDANÇA 2: Adicionar novos campos] ---
    if (showToWatchList !== undefined) dataToUpdate.showToWatchList = showToWatchList;
    if (showWatchingList !== undefined) dataToUpdate.showWatchingList = showWatchingList;
    if (showWatchedList !== undefined) dataToUpdate.showWatchedList = showWatchedList;
    if (showDroppedList !== undefined) dataToUpdate.showDroppedList = showDroppedList;
    // --- [FIM DA MUDANÇA 2] ---

    // Atualiza o utilizador
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      // --- [MUDANÇA 3: Selecionar os novos campos para retornar] ---
      select: { 
        bio: true, 
        profileVisibility: true,
        showToWatchList: true,
        showWatchingList: true,
        showWatchedList: true,
        showDroppedList: true
      } 
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error("Erro ao atualizar definições:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
       return new NextResponse(JSON.stringify({ error: "Utilizador não encontrado." }), { status: 404 });
    }
    return new NextResponse(JSON.stringify({ error: "Erro interno ao guardar definições." }), { status: 500 });
  }
}
