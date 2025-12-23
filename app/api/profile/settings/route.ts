import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache"; // 👈 Importante

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    
    // Lista completa dos seus campos
    const { 
      name, bio, username, twitchUsername, discordWebhookUrl, profileBannerUrl,
      youtubeMainUrl, youtubeSecondUrl, youtubeThirdUrl, youtubeFourthUrl,
      amazonWishlistUrl, statFollowers, statMedia, statRegion,
      profileVisibility, showToWatchList, showWatchingList, showWatchedList, showDroppedList
    } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name, bio, username, twitchUsername, discordWebhookUrl, profileBannerUrl,
        youtubeMainUrl, youtubeSecondUrl, youtubeThirdUrl, youtubeFourthUrl,
        amazonWishlistUrl, statFollowers, statMedia, statRegion,
        profileVisibility, showToWatchList, showWatchingList, showWatchedList, showDroppedList
      },
    });

    // ⚡ O SEGREDO ESTÁ AQUI: Força a atualização imediata das páginas
    revalidatePath("/sobre");      // Atualiza a página "Sobre"
    revalidatePath("/");           // Atualiza a Home (caso a bio apareça lá)
    revalidatePath("/redes");      // Atualiza a página de Redes (caso a bio apareça lá)
    
    // Atualiza caches globais baseados no username
    if (username) {
        revalidateTag(`user-profile-${username.toLowerCase()}`);
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Erro update profile:", error);
    return new NextResponse("Erro Interno", { status: 500 });
  }
}