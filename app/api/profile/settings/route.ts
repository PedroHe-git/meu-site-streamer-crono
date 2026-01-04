import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    
    // 1. Ajustei a lista de campos (Adicionei Instagram, Removi stats manuais antigos)
    const { 
      name, bio, username, twitchUsername, discordWebhookUrl, profileBannerUrl,
      youtubeMainUrl, youtubeSecondUrl, youtubeThirdUrl, youtubeFourthUrl,
      amazonWishlistUrl, 
      statRegion,             // Região continua manual
      instagramFollowersCount, // 👈 NOVO CAMPO
      profileVisibility, showToWatchList, showWatchingList, showWatchedList, showDroppedList
    } = body;

    let validVisibility = undefined;
    if (profileVisibility === 'PUBLIC' || profileVisibility === 'PRIVATE') {
        validVisibility = profileVisibility;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name, bio, username, twitchUsername, discordWebhookUrl, profileBannerUrl,
        youtubeMainUrl, youtubeSecondUrl, youtubeThirdUrl, youtubeFourthUrl,
        amazonWishlistUrl, 
        
        statRegion, // Continua manual
        instagramFollowersCount: Number(instagramFollowersCount) || 0, // 👈 Salvando o Instagram
        
        // statFollowers e statMedia foram REMOVIDOS daqui para não sobrescrever o cálculo automático
        
        profileVisibility: validVisibility, 
        showToWatchList, showWatchingList, showWatchedList, showDroppedList
      },
    });

    // Força a atualização imediata das páginas
    revalidatePath("/sobre");
    revalidatePath("/");
    revalidatePath("/redes");
    
    if (username) {
        revalidateTag(`user-profile-${username.toLowerCase()}`);
    }

    // 3. CORREÇÃO DO ERRO "BigInt serialization"
    // O JavaScript não consegue transformar BigInt em JSON direto.
    // Convertemos para String antes de devolver.
    const responseData = {
      ...updatedUser,
      youtubeViewsCount: updatedUser.youtubeViewsCount?.toString() || "0", // 👈 O Pulo do Gato
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Erro update profile:", error);
    return new NextResponse("Erro Interno", { status: 500 });
  }
}