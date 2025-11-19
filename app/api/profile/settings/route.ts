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
      profileBannerUrl,
      discordWebhookUrl, // <--- [NOVO] 1. Receber o campo
      showToWatchList,
      showWatchingList,
      showWatchedList,
      showDroppedList,
    } = body;

    // Validação de Segurança para o Webhook
    if (discordWebhookUrl && typeof discordWebhookUrl === 'string') {
       if (!discordWebhookUrl.startsWith('https://discord.com/api/webhooks/')) {
          return new NextResponse(JSON.stringify({ error: "URL do Discord inválida" }), { status: 400 });
       }
    }

    if (profileBannerUrl && typeof profileBannerUrl === 'string') {
       if (!profileBannerUrl.startsWith('https://')) {
          return new NextResponse(JSON.stringify({ error: "URL de banner inválida" }), { status: 400 });
       }
    }
    
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
        profileBannerUrl: profileBannerUrl,
        discordWebhookUrl: discordWebhookUrl || null, // <--- [NOVO] 2. Salvar no Banco
        showToWatchList: showToWatchList,
        showWatchingList: showWatchingList,
        showWatchedList: showWatchedList,
        showDroppedList: showDroppedList,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[SETTINGS_PUT]', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}