// lib/authOptions.ts

import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitchProvider from "next-auth/providers/twitch";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid'; // <-- 1. Importa o UUID

// Interface para dados que QUEREMOS no token/sessão
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  username: string;
  role: UserRole;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // --- 2. ADICIONA O CALLBACK PROFILE ---
      profile(profile) {
        // 'profile' é o que o Google envia.
        // Nós o adaptamos ao nosso schema 'User' do Prisma.
        if (!profile.email) {
          throw new Error("Provedor OAuth sem email não é suportado.");
        }
        return {
          // Dados padrão do Google
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          
          // --- Nossas Adições (Campos obrigatórios) ---
          // Isso só será usado se for um NOVO usuário.
          // Geramos um username único baseado no email + um ID aleatório.
          username: profile.email.split('@')[0] + '-' + uuidv4().substring(0, 4),
          role: UserRole.VISITOR, // Define o role padrão para novos usuários OAuth
        };
      },
    }),
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      // --- 3. ADICIONA O CALLBACK PROFILE ---
      profile(profile) {
        // 'profile' é o que o Twitch envia.
        if (!profile.email) {
          throw new Error("Provedor OAuth sem email não é suportado.");
        }
        return {
          // Dados padrão do Twitch
          id: profile.sub,
          name: profile.preferred_username, // Twitch usa 'preferred_username'
          email: profile.email,
          image: profile.picture,
          
          // --- Nossas Adições (Campos obrigatórios) ---
          username: profile.preferred_username + '-' + uuidv4().substring(0, 4),
          role: UserRole.VISITOR,
        };
      },
    }),
    CredentialsProvider({
      // (A sua lógica de Credentials permanece exatamente a mesma)
      name: "Credentials",
      credentials: { email: { label: "Email", type: "text" }, password: { label: "Password", type: "password" }, },
      async authorize(credentials) {
          console.log("--- [Authorize Start - Minimal Return] ---");
          if (!credentials?.email || !credentials?.password) { throw new Error("Email e senha são obrigatórios"); }
          const user = await prisma.user.findUnique({ where: { email: credentials.email }, });
          if (!user || !user.hashedPassword) { throw new Error("Utilizador não encontrado ou registado com outro método"); }
          const isPasswordCorrect = await bcrypt.compare( credentials.password, user.hashedPassword );
          if (!isPasswordCorrect) { throw new Error("Senha incorreta"); }
          console.log(`[Authorize Success] Autenticação OK para ${credentials.email}`);
          return {
              id: user.id,
              name: user.name,
              email: user.email,
              username: user.username,
              role: user.role,
          };
      }
    }),
  ],
  
  // O resto do arquivo permanece igual
  pages: { signIn: "/auth/signin", },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
         token.id = user.id;
         token.username = (user as any).username;
         token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as SessionUser;
        sessionUser.id = token.id as string;
        sessionUser.username = token.username as string;
        sessionUser.role = token.role as UserRole;
      }
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};