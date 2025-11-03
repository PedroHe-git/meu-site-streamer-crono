// types/next-auth.d.ts (Atualizado)

import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"
import { UserRole, ProfileVisibility } from "@prisma/client";

// Estende o tipo 'user' dentro da sessão
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: UserRole;
      bio?: string | null;
      profileVisibility: ProfileVisibility;
      image?: string | null; 
      twitchUsername?: string | null;
      // --- [MUDANÇA AQUI] ---
      showToWatchList: boolean;
      showWatchingList: boolean;
      showWatchedList: boolean;
      showDroppedList: boolean;
      // --- [FIM DA MUDANÇA] ---
    } & DefaultSession["user"] 
  }

  // Estende o tipo User base (usado no login inicial)
  interface User {
    username: string;
    role: UserRole;
    bio?: string | null;
    profileVisibility: ProfileVisibility;
    image?: string | null; 
    twitchUsername?: string | null;
    // --- [MUDANÇA AQUI] ---
    showToWatchList: boolean;
    showWatchingList: boolean;
    showWatchedList: boolean;
    showDroppedList: boolean;
    // --- [FIM DA MUDANÇA] ---
  }
}

// Estende o tipo JWT (JSON Web Token)
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: UserRole;
    bio?: string | null;
    profileVisibility: ProfileVisibility;
    image?: string | null; 
    twitchUsername?: string | null;
    // --- [MUDANÇA AQUI] ---
    showToWatchList: boolean;
    showWatchingList: boolean;
    showWatchedList: boolean;
    showDroppedList: boolean;
    // --- [FIM DA MUDANÇA] ---
  }
}
