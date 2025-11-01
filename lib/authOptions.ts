// lib/authOptions.ts (Corrigido)

import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitchProvider from "next-auth/providers/twitch";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
// Importe os Enums
import { UserRole, ProfileVisibility } from "@prisma/client"; 
import { v4 as uuidv4 } from 'uuid';

// --- [MUDANÇA 1: Atualizar a Interface da Sessão] ---
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  username: string;
  role: UserRole;
  bio?: string | null;
  profileVisibility: ProfileVisibility; // <-- ADICIONADO
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
          bio: null,
          profileVisibility: ProfileVisibility.PUBLIC, // <-- ADICIONADO
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
          profileVisibility: ProfileVisibility.PUBLIC, // <-- ADICIONADO
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
            
            // --- [MUDANÇA 2: Adicionar todos os campos ao return] ---
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
                bio: user.bio,
                profileVisibility: user.profileVisibility, // <-- ADICIONADO
            };
        }
     }),
  ],
  pages: { signIn: "/auth/signin", },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // --- [MUDANÇA 3: Passar campos para o Token] ---
    async jwt({ token, user }) {
      if (user) {
         // O objeto 'user' aqui é o que foi retornado do 'authorize'
         token.id = user.id;
         token.username = (user as any).username;
         token.role = (user as any).role;
         token.bio = (user as any).bio;
         token.profileVisibility = (user as any).profileVisibility; // <-- ADICIONADO
      }
      return token;
    },
    
    // --- [MUDANÇA 4: Passar campos do Token para a Sessão] ---
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as SessionUser;
        sessionUser.id = token.id as string;
        sessionUser.username = token.username as string;
        sessionUser.role = token.role as UserRole;
        sessionUser.bio = token.bio as string | null; // <-- ADICIONADO
        sessionUser.profileVisibility = token.profileVisibility as ProfileVisibility; // <-- ADICIONADO
      }
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};