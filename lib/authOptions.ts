// lib/authOptions.ts

import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitchProvider from "next-auth/providers/twitch";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid'; // Importa o UUID

// --- [MUDANÇA 1: Adicionar 'bio' à Interface] ---
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  username: string;
  role: UserRole;
  bio?: string | null; // <-- ADICIONADO
  profileVisibility?: ProfileVisibility;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({ 
      clientId: process.env.GOOGLE_CLIENT_ID!, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        if (!profile.email) {
          throw new Error("Provedor OAuth sem email não é suportado.");
        }
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          username: profile.email.split('@')[0] + '-' + uuidv4().substring(0, 4),
          role: UserRole.VISITOR, 
          bio: null, // Bio padrão
          profileVisibility: user.profileVisibility
        };
      },
    }),
    TwitchProvider({ 
      clientId: process.env.TWITCH_CLIENT_ID!, 
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      profile(profile) {
        if (!profile.email) {
          throw new Error("Provedor OAuth sem email não é suportado.");
        }
        return {
          id: profile.sub,
          name: profile.preferred_username,
          email: profile.email,
          image: profile.picture,
          username: profile.preferred_username + '-' + uuidv4().substring(0, 4),
          role: UserRole.VISITOR,
          bio: null,
        };
      },
    }),
    CredentialsProvider({
        name: "Credentials",
        credentials: { email: { label: "Email", type: "text" }, password: { label: "Password", type: "password" }, },
        async authorize(credentials) {
            if (!credentials?.email || !credentials?.password) { throw new Error("Email e senha são obrigatórios"); }
            const user = await prisma.user.findUnique({ where: { email: credentials.email }, });
            if (!user || !user.hashedPassword) { throw new Error("Utilizador não encontrado ou registado com outro método"); }
            
            const isPasswordCorrect = await bcrypt.compare( credentials.password, user.hashedPassword );
            if (!isPasswordCorrect) { throw new Error("Senha incorreta"); }

            if (!user.emailVerified) {
              throw new Error("Por favor, verifique seu email antes de fazer login.");
            }
            
            // --- [MUDANÇA 2: Adicionar 'bio' ao return] ---
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
                bio: user.bio, // <-- ADICIONADO
            };
        }
     }),
  ],
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
         token.bio = (user as any).bio; // <-- ADICIONADO
         token.profileVisibility = (user as any).profileVisibility;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as SessionUser;
        sessionUser.id = token.id as string;
        sessionUser.username = token.username as string;
        sessionUser.role = token.role as UserRole;

        // --- [MUDANÇA 4: Adicionar 'bio' à Sessão] ---
        sessionUser.bio = token.bio as string; // <-- ADICIONADO
        sessionUser.profileVisibility = token.profileVisibility as ProfileVisibility;
      }
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};