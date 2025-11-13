import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from '@/lib/prisma';
import { put, del } from "@vercel/blob"; 
import { Prisma } from "@prisma/client";
import crypto from "crypto"; // Importa o crypto

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
  }
  
  const userId = session.user.id;
  
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    // --- [INÍCIO DA CORREÇÃO 1] ---
    // Lê o tipo que enviámos (avatar ou banner)
    const type = formData.get("type") as "avatar" | "banner" | null;

    if (!file) {
      return new NextResponse(JSON.stringify({ error: "Nenhum ficheiro fornecido" }), { status: 400 });
    }
    if (!type) {
      return new NextResponse(JSON.stringify({ error: "Nenhum tipo (avatar/banner) fornecido" }), { status: 400 });
    }
    if (file.size > 4 * 1024 * 1024) { // 4MB
       return new NextResponse(JSON.stringify({ error: "Ficheiro excede os 4MB." }), { status: 413 });
    }
    
    // Determina a pasta, o campo da DB e a URL antiga a apagar
    let folder: string;
    let dbField: "image" | "profileBannerUrl";
    let oldImageUrl: string | null;
    
    if (type === 'avatar') {
      folder = 'avatars';
      dbField = 'image';
      
      oldImageUrl = session.user.image || null;
    } else { // type === 'banner'
      folder = 'banners';
      dbField = 'profileBannerUrl';
      
      oldImageUrl = session.user.profileBannerUrl || null;
    }

    const fileExtension = file.name.split('.').pop() || 'png';
    // Cria um nome de ficheiro único
    const filename = `${folder}/user_${userId}_${type}_${crypto.randomUUID()}.${fileExtension}`;
    // --- [FIM DA CORREÇÃO 1] ---

    const newBlob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false, // Já usamos UUID
    });

    // --- [INÍCIO DA CORREÇÃO 2] ---
    // Atualiza o campo correto (image OU profileBannerUrl)
    await prisma.user.update({
      where: { id: userId },
      data: { [dbField]: newBlob.url }, // Usa a variável dbField
    });
    // --- [FIM DA CORREÇÃO 2] ---

    // Apaga a imagem antiga (seja avatar ou banner)
    if (oldImageUrl) {
      try {
        await del(oldImageUrl);
      } catch (delError) {
        console.error(`Erro ao apagar ${type} antigo:`, delError);
        // Não falha a requisição inteira se a deleção falhar
      }
    }

    // Retorna o URL para o handleSaveSettings
    return NextResponse.json({ url: newBlob.url, message: `${type} atualizado` });

  } catch (error: any) {
    console.error("Erro na API de upload:", error);
    
    const errorMessage = error.message || "Erro interno do servidor.";
    return new NextResponse(JSON.stringify({ error: `Erro ao fazer upload: ${errorMessage}` }), { status: 500 });
  }
}