// app/api/profile/settings/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ProfileVisibility } from '@prisma/client';

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session?.user?.id) {
    return new NextResponse('Não autorizado', { status: 401 });
  }
  // @ts-ignore
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