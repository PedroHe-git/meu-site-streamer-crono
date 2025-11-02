import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from '@/lib/prisma';
import { Prisma, UserRole, ProfileVisibility } from "@prisma/client"; 

export const runtime = 'nodejs';

// --- PUT: Atualiza as definições do perfil (Bio e Privacidade APENAS) ---
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
    
    // --- MUDANÇA 1: 'image' foi removido daqui ---
    const { bio, profileVisibility } = body; 

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
    // --- MUDANÇA 2: Validação da 'image' removida ---
    
    // --- Fim Validações ---

    // --- MUDANÇA 3: 'image' removida do objeto de atualização ---
    const dataToUpdate: Prisma.UserUpdateInput = {};
    if (bio !== undefined) dataToUpdate.bio = bio;
    if (profileVisibility !== undefined) dataToUpdate.profileVisibility = profileVisibility;

    // Atualiza o utilizador
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      // --- MUDANÇA 4: 'image' removida do 'select' de retorno ---
      select: { bio: true, profileVisibility: true } 
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

