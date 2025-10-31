import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from '@/lib/prisma';
import { Prisma, UserRole } from "@prisma/client"; // Importa UserRole

export const runtime = 'nodejs';
export const region = 'gru1';

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
    const { bio } = body; // Recebe apenas 'bio'

    // --- Validações Simplificadas ---
    if (bio !== undefined && typeof bio !== 'string') {
        return new NextResponse(JSON.stringify({ error: "Biografia inválida." }), { status: 400 });
    }
    // Limita o tamanho da bio
    if (bio && bio.length > 200) {
         return new NextResponse(JSON.stringify({ error: "Biografia excede 200 caracteres." }), { status: 400 });
    }
    // --- Fim Validações ---

    // Prepara os dados para atualização (apenas 'bio')
    const dataToUpdate: Prisma.UserUpdateInput = {};
    if (bio !== undefined) dataToUpdate.bio = bio;
    // --- [REMOVIDO] profileThemeColor e profileBannerUrl ---

    // Atualiza o utilizador
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: { bio: true } // Retorna apenas o campo atualizado
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error("Erro ao atualizar definições:", error);
    // Este erro (P2025) pode acontecer se o ID da sessão for inválido
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
       return new NextResponse(JSON.stringify({ error: "Utilizador não encontrado." }), { status: 404 });
    }
    return new NextResponse(JSON.stringify({ error: "Erro interno ao guardar definições." }), { status: 500 });
  }
}

