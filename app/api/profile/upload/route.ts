import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from '@/lib/prisma';
import { put, del } from "@vercel/blob"; 
import { Prisma } from "@prisma/client";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }
  const userId = session.user.id;
  
  const oldImageUrl = session.user.image;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse(JSON.stringify({ error: "Nenhum ficheiro fornecido" }), { status: 400 });
    }

    if (file.size > 4 * 1024 * 1024) { // 4MB
       return new NextResponse(JSON.stringify({ error: "Ficheiro excede os 4MB." }), { status: 413 });
    }
    
    // --- [MUDANÇA: Garantir extensão .png] ---
    // O ficheiro que vem do canvas chama-se "avatar.png"
    const fileExtension = file.name.split('.').pop() || 'png';
    const filename = `avatars/user_${userId}_avatar_${crypto.randomUUID()}.${fileExtension}`;
    // --- [FIM DA MUDANÇA] ---

    const newBlob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true, // Garante nome único
    });

    await prisma.user.update({
      where: { id: userId },
      data: { image: newBlob.url },
    });

    if (oldImageUrl) {
      try {
        await del(oldImageUrl);
      } catch (delError) {
        console.error("Erro ao apagar avatar antigo:", delError);
      }
    }

    return NextResponse.json({ url: newBlob.url, message: "Avatar atualizado" });

  } catch (error: any) {
    console.error("Erro na API de upload:", error);
    
    const errorMessage = error.message || "Erro interno do servidor.";
    return new NextResponse(JSON.stringify({ error: `Erro ao fazer upload: ${errorMessage}` }), { status: 500 });
  }
}

