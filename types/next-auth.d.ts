// types/next-auth.d.ts (Atualizado)

import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt"; 
import { UserRole, ProfileVisibility } from "@prisma/client";

// Estende o tipo 'User' base do NextAuth
declare module "next-auth" {
  /**
   * O 'DefaultUser' já tem 'name', 'email', 'image'.
   * Nós estendemo-lo para incluir os nossos campos do Prisma.
   */
  interface User extends DefaultUser {
    id: string; 
    role: UserRole;
    username: string;
    bio: string | null;
    profileVisibility: ProfileVisibility;
    twitchUsername: string | null;
    showToWatchList: boolean;
    showWatchingList: boolean;
    showWatchedList: boolean;
    showDroppedList: boolean;
    profileBannerUrl: string | null; // <-- ADICIONADO AQUI
  }

  /**
   * A 'Session' agora usa a nossa interface 'User' personalizada.
   */
  interface Session extends DefaultSession {
    user: User;
  }
}

// Estende o 'JWT'
declare module "next-auth/jwt" {
  /**
   * O 'DefaultJWT' já tem 'name', 'email', e 'picture' (para a imagem).
   * Nós só precisamos de adicionar os NOSSOS campos customizados.
   */
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    username: string;
    bio: string | null;
    profileVisibility: ProfileVisibility;
    twitchUsername: string | null;
    showToWatchList: boolean;
    showWatchingList: boolean;
    showWatchedList: boolean;
    showDroppedList: boolean;
    profileBannerUrl: string | null; // <-- ADICIONADO AQUI
  }
}