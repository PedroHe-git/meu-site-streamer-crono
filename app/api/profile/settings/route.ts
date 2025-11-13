// app/api/profile/settings/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ProfileVisibility } from '@prisma/client';

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse('Não autorizado', { status: 401 });
  }
  
  const userId = session.user.id;

  try {
    const body = await request.json();
    const {
      name,
      bio,
      profileVisibility,
      image,
      profileBannerUrl, // <-- [NOVO] 1. Recebe o URL do banner
      showToWatchList,
      showWatchingList,
      showWatchedList,
      showDroppedList,
    } = body;

    if (profileBannerUrl && typeof profileBannerUrl === 'string') {
       // Verifica se começa com https (bloqueia 'javascript:alert(1)')
       if (!profileBannerUrl.startsWith('https://')) {
          return new NextResponse(JSON.stringify({ error: "URL de banner inválida" }), { status: 400 });
       }
       
       // OPCIONAL: Verificar se vem do Vercel Blob para segurança máxima
       // if (!profileBannerUrl.includes('public.blob.vercel-storage.com')) {
       //    return new NextResponse(JSON.stringify({ error: "Domínio de imagem não permitido" }), { status: 400 });
       // }
    }
    
    // Mesma lógica para o avatar (image) se desejar
    if (image && typeof image === 'string' && !image.startsWith('https://')) {
        return new NextResponse(JSON.stringify({ error: "URL de avatar inválida" }), { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name,
        bio: bio,
        profileVisibility: profileVisibility as ProfileVisibility,
        image: image,
        profileBannerUrl: profileBannerUrl, // <-- [NOVO] 2. Salva o URL do banner
        showToWatchList: showToWatchList,
        showWatchingList: showWatchingList,
        showWatchedList: showWatchedList,
        showDroppedList: showDroppedList,
      },
    });

    // Retorna os dados atualizados
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[SETTINGS_PUT]', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}