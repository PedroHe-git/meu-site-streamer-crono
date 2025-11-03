// lib/authOptions.ts (Atualizado)

import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitchProvider from "next-auth/providers/twitch";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { UserRole, ProfileVisibility, Prisma } from "@prisma/client"; 
import { v4 as uuidv4 } from 'uuid';

// Este tipo agora reflete a nossa definição em next-auth.d.ts
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  username: string;
  role: UserRole;
  bio?: string | null;
  profileVisibility: ProfileVisibility;
  image?: string | null;
  twitchUsername?: string | null; 
  // --- [MUDANÇA AQUI] ---
  showToWatchList: boolean;
  showWatchingList: boolean;
  showWatchedList: boolean;
  showDroppedList: boolean;
  // --- [FIM DA MUDANÇA] ---
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({ 
      clientId: process.env.GOOGLE_CLIENT_ID!, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          username: profile.email.split('@')[0] + '-' + uuidv4().substring(0, 4),
          role: UserRole.VISITOR, 
          bio: null,
          profileVisibility: ProfileVisibility.PUBLIC,
          twitchUsername: null,
          // --- [MUDANÇA AQUI] ---
          // Define os padrões para novos utilizadores
          showToWatchList: true,
          showWatchingList: true,
          showWatchedList: true,
          showDroppedList: true,
          // --- [FIM DA MUDANÇA] ---
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
          profileVisibility: ProfileVisibility.PUBLIC,
          twitchUsername: profile.preferred_username,
          // --- [MUDANÇA AQUI] ---
          showToWatchList: true,
          showWatchingList: true,
          showWatchedList: true,
          showDroppedList: true,
          // --- [FIM DA MUDANÇA] ---
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
            
            // Retorna o utilizador completo (incluindo os novos campos)
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
                bio: user.bio,
                profileVisibility: user.profileVisibility,
                image: user.image,
                twitchUsername: user.twitchUsername,
                // --- [MUDANÇA AQUI] ---
                showToWatchList: user.showToWatchList,
                showWatchingList: user.showWatchingList,
                showWatchedList: user.showWatchedList,
                showDroppedList: user.showDroppedList,
                // --- [FIM DA MUDANÇA] ---
            };
        }
     }),
  ],
  pages: { signIn: "/auth/signin", },
  session: { strategy: "jwt" },

  events: {
    async linkAccount({ user, account, profile }) {
      if (account.provider === "twitch") {
        const dataToUpdate: Prisma.UserUpdateInput = {};
        // @ts-ignore
        dataToUpdate.twitchUsername = profile.preferred_username || null;
        // @ts-ignore
        const twitchPicture = profile.picture as string | null;
        if (!user.image && twitchPicture) {
          dataToUpdate.image = twitchPicture;
        }
        await prisma.user.update({
          where: { id: user.id },
          data: dataToUpdate,
        });
      }
    }
  },

  callbacks: {
    async jwt({ token, user, trigger, session, account, profile }) { 
      
      // No login inicial (user existe)
      if (user) {
         token.id = user.id;
         token.username = user.username;
         token.role = user.role;
         token.bio = user.bio;
         token.profileVisibility = user.profileVisibility;
         token.image = user.image;
         token.twitchUsername = user.twitchUsername;
         // --- [MUDANÇA AQUI] ---
         token.showToWatchList = user.showToWatchList;
         token.showWatchingList = user.showWatchingList;
         token.showWatchedList = user.showWatchedList;
         token.showDroppedList = user.showDroppedList;
         // --- [FIM DA MUDANÇA] ---
      }

      // Quando uma nova conta é VINCULADA (ex: Twitch)
      if (trigger === "update" && account && profile) {
        if (account.provider === "twitch") {
          // @ts-ignore
          token.twitchUsername = profile.preferred_username;
          // @ts-ignore
          const twitchPicture = profile.picture as string | null;
          if (!token.image && twitchPicture) {
            token.image = twitchPicture;
          }
        }
      }

      // Quando a sessão é atualizada manualmente (ex: salvar bio ou novo avatar)
      if (trigger === "update" && session?.user) {
        if (session.user.bio !== undefined) {
          token.bio = session.user.bio;
        }
        if (session.user.profileVisibility !== undefined) {
          token.profileVisibility = session.user.profileVisibility;
        }
        if (session.user.image !== undefined) {
            token.image = session.user.image;
        }
        // --- [MUDANÇA AQUI] ---
        // Atualiza o token com as novas definições de visibilidade
        if (session.user.showToWatchList !== undefined) {
          token.showToWatchList = session.user.showToWatchList;
        }
        if (session.user.showWatchingList !== undefined) {
          token.showWatchingList = session.user.showWatchingList;
        }
        if (session.user.showWatchedList !== undefined) {
          token.showWatchedList = session.user.showWatchedList;
        }
        if (session.user.showDroppedList !== undefined) {
          token.showDroppedList = session.user.showDroppedList;
        }
        // --- [FIM DA MUDANÇA] ---
      }

      return token; 
    },
    
    async session({ session, token }) {
      // Passa todos os dados do token para a sessão do cliente
      if (session.user) {
        const sessionUser = session.user as SessionUser;
        sessionUser.id = token.id as string;
        sessionUser.username = token.username as string;
        sessionUser.role = token.role as UserRole;
        sessionUser.bio = token.bio as string | null;
        sessionUser.profileVisibility = token.profileVisibility as ProfileVisibility;
        sessionUser.image = token.image as string | null; 
        sessionUser.twitchUsername = token.twitchUsername as string | null;
        // --- [MUDANÇA AQUI] ---
        sessionUser.showToWatchList = token.showToWatchList;
        sessionUser.showWatchingList = token.showWatchingList;
        sessionUser.showWatchedList = token.showWatchedList;
        sessionUser.showDroppedList = token.showDroppedList;
        // --- [FIM DA MUDANÇA] ---
      }
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
