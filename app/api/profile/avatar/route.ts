import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
// Importa authOptions da API route v4
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from '@/lib/prisma';
import { Prisma } from "@prisma/client";

// Limite de tamanho para Base64
const MAX_BASE64_SIZE = 2.7 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // --- [CORREÇÃO AQUI] Usa type assertion '(session.user as any).id' ---
  // Verifica se a sessão e o utilizador existem, DEPOIS tenta aceder ao ID
  // Usamos 'as any' ou um tipo mais específico se preferir
  const userId = session?.user ? (session.user as { id?: string }).id : undefined;

  if (!userId) {
  // --- [FIM CORREÇÃO] ---
    return new NextResponse(JSON.stringify({ error: "Não autorizado ou ID do utilizador em falta na sessão" }), { status: 401 });
  }

  try {
    const body = await request.json();
    const { imageBase64 } = body;

    // Validações (Base64, Tamanho, MimeType)
    if (!imageBase64 || typeof imageBase64 !== 'string' || !imageBase64.startsWith('data:image/')) {
       return new NextResponse(JSON.stringify({ error: "Dados da imagem inválidos." }), { status: 400 });
    }
    if (Buffer.byteLength(imageBase64, 'utf8') > MAX_BASE64_SIZE) {
       return new NextResponse(JSON.stringify({ error: "Imagem demasiado grande (máx 2MB)." }), { status: 413 });
    }
    const mimeType = imageBase64.substring("data:".length, imageBase64.indexOf(";base64"));
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
       return new NextResponse(JSON.stringify({ error: "Formato de imagem inválido (PNG, JPG, WEBP)." }), { status: 415 });
    }


    // Atualiza o campo 'image' do utilizador
    const updatedUser = await prisma.user.update({
      where: {
        id: userId, // Usa o ID obtido da sessão
      },
      data: {
        image: imageBase64, // Guarda a string Base64
      },
      select: { // Retorna apenas o campo atualizado
        image: true,
      }
    });

    // Retorna a nova URL/Base64 da imagem
    return NextResponse.json({ image: updatedUser.image });

  } catch (error) {
    console.error("Erro ao atualizar avatar:", error);
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
       return new NextResponse(JSON.stringify({ error: "Utilizador não encontrado na base de dados." }), { status: 404 });
    }
    return new NextResponse(JSON.stringify({ error: "Erro interno ao guardar avatar." }), { status: 500 });
  }
}

