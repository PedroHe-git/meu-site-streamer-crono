import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt"; 
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string; 
    role: UserRole;
    username: string;
    bio: string | null;
    profileVisibility: 'PUBLIC' | 'PRIVATE';
    twitchUsername: string | null;
    showToWatchList: boolean;
    showWatchingList: boolean;
    showWatchedList: boolean;
    showDroppedList: boolean;
    profileBannerUrl: string | null;
    discordWebhookUrl: string | null;

    // 👇 NOVOS CAMPOS ADICIONADOS
    youtubeMainUrl: string | null;
    youtubeSecondUrl: string | null;
    youtubeThirdUrl: string | null;
    youtubeFourthUrl: string | null;
    
    statMedia: string | null;
    statRegion: string | null;
    amazonWishlistUrl: string | null;
  }

  interface Session extends DefaultSession {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    username: string;
    bio: string | null;
    profileVisibility: 'PUBLIC' | 'PRIVATE';
    twitchUsername: string | null;
    showToWatchList: boolean;
    showWatchingList: boolean;
    showWatchedList: boolean;
    showDroppedList: boolean;
    profileBannerUrl: string | null;
    discordWebhookUrl: string | null;

    // 👇 NOVOS CAMPOS ADICIONADOS
    youtubeMainUrl: string | null;
    youtubeSecondUrl: string | null;
    youtubeThirdUrl: string | null;
    youtubeFourthUrl: string | null;

    statMedia: string | null;
    statRegion: string | null;
    amazonWishlistUrl: string | null;
  }
}