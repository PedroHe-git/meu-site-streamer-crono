// types/next-auth.d.ts (Corrigido)

import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"
// Importe os Enums
import { UserRole, ProfileVisibility } from "@prisma/client";

// Estende o tipo 'user' dentro da sessão
declare module "next-auth" {
  interface Session {
    user: {
      /** O ID do utilizador da base de dados */
      id: string;
      /** O username único da base de dados */
      username: string;
      /** A função do utilizador (CREATOR ou VISITOR) */
      role: UserRole;
      /** A biografia do utilizador */
      bio?: string | null;
      /** A definição de privacidade do perfil */
      profileVisibility: ProfileVisibility;
    } & DefaultSession["user"] // Preserva os campos padrão (name, email, image)
  }

  // Também estendemos o modelo User (usado no adapter e 'authorize')
  interface User {
    username: string;
    role: UserRole;
    bio?: string | null;
    profileVisibility: ProfileVisibility;
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
  }
}