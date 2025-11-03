// lib/authOptions.ts (FINALMENTE CORRIGIDO)

import { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient, UserRole } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import TwitchProvider from "next-auth/providers/twitch"; 
import bcrypt from "bcrypt"; 
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  // @ts-ignore
  adapter: PrismaAdapter(prisma),
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      
      profile(profile) {
        return {
          id: profile.sub, 
          name: profile.preferred_username, 
          email: profile.email,
          image: profile.picture, 
          role: UserRole.VISITOR, 
          username: profile.preferred_username.toLowerCase(),
          twitchUsername: profile.preferred_username, 
          bio: null, 
          profileVisibility: 'PUBLIC', 
          showToWatchList: true, 
          showWatchingList: true, 
          showWatchedList: true, 
          showDroppedList: true, 
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: UserRole.VISITOR,
          username: profile.email.split('@')[0].toLowerCase(), 
          twitchUsername: null, 
          bio: null, 
          profileVisibility: 'PUBLIC', 
          showToWatchList: true, 
          showWatchingList: true, 
          showWatchedList: true, 
          showDroppedList: true, 
        };
      },
    }),
    
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciais inválidas");
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.hashedPassword) {
          throw new Error("Credenciais inválidas");
        }
        
        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );
        if (!isCorrectPassword) {
          throw new Error("Credenciais inválidas");
        }
        return user; 
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      
      if (account?.provider === "credentials") {
        // @ts-ignore
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser?.emailVerified) {
           console.log("Tentativa de login com email não verificado:", user.email);
           return false; 
        }
      }
      
      if ((account?.provider === "google" || account?.provider === "twitch") && user.email) {
        
        const existingUser = await prisma.user.findUnique({
           where: { email: user.email }
        });

        if (existingUser && account.provider === "twitch") {
           await prisma.user.update({
             where: { id: existingUser.id },
             data: {
               // @ts-ignore
               twitchUsername: (profile as any)?.preferred_username,
             }
           });
           // @ts-ignore
           user.twitchUsername = (profile as any)?.preferred_username;
        }
      }
      return true; 
    },

    async jwt({ token, user, trigger, session }) {
      
      // 1. No login inicial (objeto 'user' está presente)
      if (user) {
        token.id = user.id;
        token.name = user.name ?? null; // Converte 'undefined' para 'null'
        // @ts-ignore
        token.role = user.role;
        // @ts-ignore
        token.username = user.username;
        // @ts-ignore
        token.bio = user.bio ?? null; // Converte 'undefined' para 'null'
        // @ts-ignore
        token.profileVisibility = user.profileVisibility;
        // @ts-ignore
        token.twitchUsername = user.twitchUsername ?? null; // Converte 'undefined' para 'null'
        // @ts-ignore
        token.showToWatchList = user.showToWatchList;
        // @ts-ignore
        token.showWatchingList = user.showWatchingList;
        // @ts-ignore
        token.showWatchedList = user.showWatchedList;
        // @ts-ignore
        token.showDroppedList = user.showDroppedList;
        // @ts-ignore
        token.picture = user.image ?? null; // Converte 'undefined' para 'null'
      }

      // 2. Ao chamar updateSession() (trigger é "update")
      if (trigger === "update" && session) {
        
        // @ts-ignore
        if (session.user) {
          // --- [INÍCIO DAS CORREÇÕES] ---
          // Temos de usar '?? null' para garantir que 'undefined' não quebre os tipos do token
          // @ts-ignore
          token.name = session.user.name ?? null;
          // @ts-ignore
          token.bio = session.user.bio ?? null;
          // @ts-ignore
          token.profileVisibility = session.user.profileVisibility;
          // @ts-ignore
          token.showToWatchList = session.user.showToWatchList;
          // @ts-ignore
          token.showWatchingList = session.user.showWatchingList;
          // @ts-ignore
          token.showWatchedList = session.user.showWatchedList;
          // @ts-ignore
          token.showDroppedList = session.user.showDroppedList;
          // @ts-ignore
          token.picture = session.user.image ?? null; 
          // --- [FIM DAS CORREÇÕES] ---
        }
      }
      
      return token;
    },

    async session({ session, token }) {
      // Passa os dados do TOKEN para a SESSÃO
      if (token) {
        // @ts-ignore
        session.user.name = token.name; 
        // @ts-ignore
        session.user.id = token.id;
        // @ts-ignore
        session.user.role = token.role;
        // @ts-ignore
        session.user.username = token.username;
        // @ts-ignore
        session.user.bio = token.bio;
        // @ts-ignore
        session.user.profileVisibility = token.profileVisibility;
        // @ts-ignore
        session.user.twitchUsername = token.twitchUsername;
        // @ts-ignore
        session.user.showToWatchList = token.showToWatchList;
        // @ts-ignore
        session.user.showWatchingList = token.showWatchingList;
        // @ts-ignore
        session.user.showWatchedList = token.showWatchedList;
        // @ts-ignore
        session.user.showDroppedList = token.showDroppedList;
        // @ts-ignore
        session.user.image = token.picture; 
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/auth/signin",
  },
};