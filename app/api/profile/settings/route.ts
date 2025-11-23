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

  // Adicionamos o campo para receber a URL completa da Twitch ou apenas o user
  twitchUrl: z.string().optional().nullable(),

  showToWatchList: z.boolean(),
  showWatchingList: z.boolean(),
  showWatchedList: z.boolean(),
  showDroppedList: z.boolean(),
});

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  try {
    const body = await request.json();
    
    // 1. Validação com Zod
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0].message;
      return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 400 });
    }

    const data = validation.data;

    // 2. Extração inteligente do Username da Twitch
    let cleanTwitchUsername = null;
    
    if (data.twitchUrl && data.twitchUrl.trim() !== "") {
      const cleanUrl = data.twitchUrl.trim();
      // Tenta extrair o username se for uma URL (twitch.tv/username)
      const match = cleanUrl.match(/(?:twitch\.tv\/|^)([\w\d_]+)(?:\?|$|\/)/i);
      
      if (match && match[1]) {
        cleanTwitchUsername = match[1];
      } else {
        // Se não parecer URL, assume que o usuário digitou só o nick
        cleanTwitchUsername = cleanUrl;
      }
    }

    // 3. Tratamento de Strings Vazias (Discord e Banner) para null
    const discordUrlToSave = (!data.discordWebhookUrl || data.discordWebhookUrl === "") 
      ? null 
      : data.discordWebhookUrl;

    const bannerUrlToSave = (!data.profileBannerUrl || data.profileBannerUrl === "")
      ? null
      : data.profileBannerUrl;

    // 4. Atualização no Banco de Dados
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        bio: data.bio,
        profileVisibility: data.profileVisibility as ProfileVisibility,
        image: data.image,
        profileBannerUrl: bannerUrlToSave,
        discordWebhookUrl: discordUrlToSave,
        
        // Salva o username extraído da Twitch
        twitchUsername: cleanTwitchUsername, 
        
        showToWatchList: data.showToWatchList,
        showWatchingList: data.showWatchingList,
        showWatchedList: data.showWatchedList,
        showDroppedList: data.showDroppedList,
      },
    });

    // --- REVALIDAÇÃO DE CACHE ---
    // Limpa o cache do perfil público para refletir mudanças instantaneamente
    if (session.user.username) {
       const tag = `user-profile-${session.user.username.toLowerCase()}`;
       revalidateTag(tag);
       console.log(`Cache revalidado para: ${tag}`);
    }

    return NextResponse.json(updatedUser);

  } catch (error: any) {
    // Tratamento específico para erro de unicidade (ex: twitchUsername duplicado)
    if (error.code === 'P2002' && error.meta?.target?.includes('twitchUsername')) {
        return new NextResponse(JSON.stringify({ error: "Este canal da Twitch já está vinculado a outra conta." }), { status: 409 });
    }

    console.error("[SETTINGS_PUT]", error);
    return new NextResponse(JSON.stringify({ error: "Erro Interno do Servidor" }), { status: 500 });
  }
}