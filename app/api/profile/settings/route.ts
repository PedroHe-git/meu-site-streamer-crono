import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ProfileVisibility } from '@prisma/client';
import { z } from "zod";

// Esquema de Validação Zod
const settingsSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome muito longo"),
  
  bio: z.string()
    .max(200, "A bio deve ter no máximo 200 caracteres")
    .nullable()
    .optional(),
    
  profileVisibility: z.enum(["PUBLIC", "FOLLOWERS_ONLY"]),
  
  image: z.string().url().optional().nullable(),
  
  profileBannerUrl: z.string()
    .optional()
    .nullable()
    .refine((val) => {
       if (!val || val === "") return true;
       return val.startsWith("https://");
    }, { message: "A URL do banner deve começar com https://" }),

  discordWebhookUrl: z.string()
    .optional()
    .nullable()
    .refine((val) => {
      if (!val || val === "") return true;
      return val.startsWith("https://discord.com/api/webhooks/");
    }, {
      message: "Deve ser um Webhook oficial do Discord (https://discord.com/api/webhooks/...)"
    }),

  showToWatchList: z.boolean(),
  showWatchingList: z.boolean(),
  showWatchedList: z.boolean(),
  showDroppedList: z.boolean(),
});

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse('Não autorizado', { status: 401 });
  }
  
  const userId = session.user.id;

  try {
    const body = await request.json();

    // CORREÇÃO: Use o método parse dentro de try-catch
    // OU acesse errors através do objeto error
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      // SOLUÇÃO 1: Acesse através de validation.error.issues
      const errorMessage = validation.error.issues[0].message;
      return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 400 });
    }

    const data = validation.data;

    // Tratamento de Strings Vazias
    const discordUrlToSave = (!data.discordWebhookUrl || data.discordWebhookUrl === "") 
      ? null 
      : data.discordWebhookUrl;

    const bannerUrlToSave = (!data.profileBannerUrl || data.profileBannerUrl === "")
      ? null
      : data.profileBannerUrl;

    // Atualização no Banco
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        bio: data.bio,
        profileVisibility: data.profileVisibility as ProfileVisibility,
        image: data.image,
        profileBannerUrl: bannerUrlToSave,
        discordWebhookUrl: discordUrlToSave,
        showToWatchList: data.showToWatchList,
        showWatchingList: data.showWatchingList,
        showWatchedList: data.showWatchedList,
        showDroppedList: data.showDroppedList,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[SETTINGS_PUT]', error);
    return new NextResponse(JSON.stringify({ error: 'Erro Interno do Servidor' }), { status: 500 });
  }
}