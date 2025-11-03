// lib/authOptions.ts (Atualizado para lidar com 'updateSession')

import { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import TwitchProvider from "next-auth/providers/twitch"; 
import bcrypt from "bcrypt"; 
import { sendVerificationEmail } from "@/lib/resend"; // (Verifique se este caminho está correto)
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
          image: profile.picture, // Importante
          twitchUsername: profile.preferred_username, 
          role: 'USER', 
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    CredentialsProvider({
      // ... (provider de credenciais sem mudanças)
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
        return user; // Retorna o objeto user completo
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // ... (signIn callback sem mudanças) ...
    async signIn({ user, account, profile }) {
      
      if (account?.provider === "credentials") {
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
               twitchUsername: (profile as any)?.preferred_username,
             }
           });
           user.twitchUsername = (profile as any)?.preferred_username;
        }
      }
      return true; 
    },

    // --- [INÍCIO DA GRANDE CORREÇÃO] ---
    // Adicionamos 'trigger' e 'session' aos argumentos
    async jwt({ token, user, trigger, session }) {
      
      // 1. No login inicial (objeto 'user' está presente)
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.bio = user.bio;
        token.profileVisibility = user.profileVisibility;
        token.twitchUsername = user.twitchUsername;
        token.showToWatchList = user.showToWatchList;
        token.showWatchingList = user.showWatchingList;
        token.showWatchedList = user.showWatchedList;
        token.showDroppedList = user.showDroppedList;
        token.picture = user.image; // Usamos 'picture' para a imagem no token
      }

      // 2. Ao chamar updateSession() (trigger é "update")
      // 'session' é o objeto que passámos para a função updateSession()
      if (trigger === "update" && session) {
        console.log("JWT Update Triggered:", session); // Log de debug
        
        // Atualiza o token com os novos dados do 'session.user'
        if (session.user) {
          token.bio = session.user.bio;
          token.profileVisibility = session.user.profileVisibility;
          token.showToWatchList = session.user.showToWatchList;
          token.showWatchingList = session.user.showWatchingList;
          token.showWatchedList = session.user.showWatchedList;
          token.showDroppedList = session.user.showDroppedList;
          
          // --- ESTA É A LINHA QUE FALTAVA ---
          // Atualiza a imagem no token
          token.picture = session.user.image; 
          // --- FIM DA LINHA QUE FALTAVA ---
        }
      }
      
      return token;
    },

    async session({ session, token }) {
      // Passa os dados do TOKEN para a SESSÃO
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.bio = token.bio;
        session.user.profileVisibility = token.profileVisibility;
        session.user.twitchUsername = token.twitchUsername;
        session.user.showToWatchList = token.showToWatchList;
        session.user.showWatchingList = token.showWatchingList;
        session.user.showWatchedList = token.showWatchedList;
        session.user.showDroppedList = token.showDroppedList;
        
        // --- E ESTA É A OUTRA METADE ---
        // Lê sempre a imagem do 'token.picture'
        session.user.image = token.picture; 
        // --- FIM DA OUTRA METADE ---
      }
      return session;
    },
    // --- [FIM DA GRANDE CORREÇÃO] ---
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/auth/signin",
  },
};