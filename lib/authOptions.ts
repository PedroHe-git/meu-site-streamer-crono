// lib/authOptions.ts

import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitchProvider from "next-auth/providers/twitch";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";

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
    GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET!, }),
    TwitchProvider({ clientId: process.env.TWITCH_CLIENT_ID!, clientSecret: process.env.TWITCH_CLIENT_SECRET!, }),
    CredentialsProvider({
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
            // Retorna o objeto correto para o callback JWT
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
  pages: { signIn: "/auth/signin", },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // Adiciona dados ao token JWT
    async jwt({ token, user }) {
      // 'user' aqui é o objeto retornado por authorize
      if (user) {
         token.id = user.id;
         token.username = (user as any).username;
         token.role = (user as any).role; // <-- A LINHA IMPORTANTE
      }
      return token;
    },
    // Adiciona dados do token ao objeto session
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as SessionUser;
        sessionUser.id = token.id as string;
        sessionUser.username = token.username as string;
        sessionUser.role = token.role as UserRole; // <-- A LINHA IMPORTANTE
      }
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};