// types/next-auth.d.ts (Corrigido)

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
      image?: string | null; // <-- Verifique se esta linha existe
      twitchUsername?: string | null;
    } & DefaultSession["user"] 
  }

  interface User {
    username: string;
    role: UserRole;
    bio?: string | null;
    profileVisibility: ProfileVisibility;
    image?: string | null; // <-- Verifique se esta linha existe
    twitchUsername?: string | null;
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
    image?: string | null; // <-- Verifique se esta linha existe
    twitchUsername?: string | null;
  }
}

