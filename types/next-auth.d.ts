// types/next-auth.d.ts

import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

// Estende o tipo 'user' dentro da sessão
declare module "next-auth" {
  interface Session {
    user: {
      /** O nosso campo personalizado da base de dados */
      username: string;
    } & DefaultSession["user"] // Preserva os campos padrão (name, email, image)
  }

  // Também estendemos o modelo User (usado no adapter)
  interface User {
    username: string;
  }
}

// Estende o tipo JWT (JSON Web Token)
declare module "next-auth/jwt" {
  interface JWT {
    username: string;
  }
}