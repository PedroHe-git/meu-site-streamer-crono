import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { ProfileVisibility } from "@prisma/client";
import { z } from "zod";
import { revalidateTag } from "next/cache"; // Importação necessária

// Schema de Validação (Zod)
const settingsSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome muito longo"),

  bio: z.string()
    .max(1000, "A bio deve ter no máximo 1000 caracteres")
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


  amazonWishlistUrl: z.string().optional().nullable(),
  youtubeMainUrl: z.string().optional().nullable(),
  youtubeSecondUrl: z.string().optional().nullable(),
  youtubeThirdUrl: z.string().optional().nullable(),  // Novo
  youtubeFourthUrl: z.string().optional().nullable(), // Novo

  // Adicionamos o campo para receber a URL completa da Twitch ou apenas o user
  twitchUrl: z.string().optional().nullable(),

  showToWatchList: z.boolean(),
  showWatchingList: z.boolean(),
  showWatchedList: z.boolean(),
  showDroppedList: z.boolean(),

  statFollowers: z.string().max(15).optional().nullable(),
  statMedia: z.string().max(15).optional().nullable(),
  statRegion: z.string().max(15).optional().nullable(),
});

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) return new NextResponse("Não autorizado", { status: 401 });

  try {
    const body = await request.json();
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(JSON.stringify({ error: validation.error.issues[0].message }), { status: 400 });
    }

    const data = validation.data;
    let cleanTwitchUsername = null;
    if (data.twitchUrl && data.twitchUrl.trim() !== "") {
      const cleanUrl = data.twitchUrl.trim();
      const match = cleanUrl.match(/(?:twitch\.tv\/|^)([\w\d_]+)(?:\?|$|\/)/i);
      cleanTwitchUsername = match && match[1] ? match[1] : cleanUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        bio: data.bio,
        profileVisibility: data.profileVisibility as ProfileVisibility,
        image: data.image,
        profileBannerUrl: data.profileBannerUrl || null,
        discordWebhookUrl: data.discordWebhookUrl || null,
        twitchUsername: cleanTwitchUsername,
        showToWatchList: data.showToWatchList,
        showWatchingList: data.showWatchingList,
        showWatchedList: data.showWatchedList,
        showDroppedList: data.showDroppedList,
        statFollowers: data.statFollowers,
        statMedia: data.statMedia,
        statRegion: data.statRegion,
        youtubeMainUrl: data.youtubeMainUrl,
        youtubeSecondUrl: data.youtubeSecondUrl,
        youtubeThirdUrl: data.youtubeThirdUrl,   // Novo
        youtubeFourthUrl: data.youtubeFourthUrl, // Novo
        amazonWishlistUrl: data.amazonWishlistUrl,
      },
    });

    // REVALIDAÇÃO
    if (session.user.username) {
      const tag = `user-profile-${session.user.username.toLowerCase()}`;
      revalidateTag(tag);
      console.log(`Cache revalidado (SETTINGS) para: ${tag}`);
    }

    return NextResponse.json(updatedUser);

  } catch (error: any) {
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}