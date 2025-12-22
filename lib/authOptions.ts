import { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
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

        return user; // O objeto user aqui vem completo do banco (incluindo youtubeUrls)
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser?.emailVerified) {
          // Se não usar verificação de email, pode remover ou comentar este bloco
          // console.log("Login recusado: Email não verificado", user.email);
          // return false; 
        }
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // 1. CARREGAMENTO INICIAL (Login)
      if (user) {
        token.id = user.id;
        token.name = user.name ?? null;
        token.picture = user.image ?? null;
        token.role = user.role;
        token.username = user.username;
        token.bio = user.bio ?? null;
        token.profileVisibility = user.profileVisibility;
        token.twitchUsername = user.twitchUsername ?? null;
        token.discordWebhookUrl = user.discordWebhookUrl ?? null;
        token.profileBannerUrl = user.profileBannerUrl ?? null;
        
        token.showToWatchList = user.showToWatchList;
        token.showWatchingList = user.showWatchingList;
        token.showWatchedList = user.showWatchedList;
        token.showDroppedList = user.showDroppedList;

        // 👇 NOVOS CAMPOS
        token.youtubeMainUrl = user.youtubeMainUrl ?? null;
        token.youtubeSecondUrl = user.youtubeSecondUrl ?? null;
        token.youtubeThirdUrl = user.youtubeThirdUrl ?? null;
        token.youtubeFourthUrl = user.youtubeFourthUrl ?? null;
        
        token.statFollowers = user.statFollowers ?? null;
        token.statMedia = user.statMedia ?? null;
        token.statRegion = user.statRegion ?? null;
      }

      // 2. ATUALIZAÇÃO VIA CLIENTE (update())
      if (trigger === "update" && session) {
        const userPayload = session.user;
        if (userPayload) {
          token.name = userPayload.name ?? token.name;
          token.picture = userPayload.image ?? token.picture;
          token.bio = userPayload.bio ?? token.bio;
          token.profileVisibility = userPayload.profileVisibility;
          token.profileBannerUrl = userPayload.profileBannerUrl ?? token.profileBannerUrl;
          
          if (userPayload.discordWebhookUrl !== undefined) token.discordWebhookUrl = userPayload.discordWebhookUrl;
          if (userPayload.twitchUsername !== undefined) token.twitchUsername = userPayload.twitchUsername;

          // 👇 ATUALIZAÇÃO DOS NOVOS CAMPOS
          if (userPayload.youtubeMainUrl !== undefined) token.youtubeMainUrl = userPayload.youtubeMainUrl;
          if (userPayload.youtubeSecondUrl !== undefined) token.youtubeSecondUrl = userPayload.youtubeSecondUrl;
          if (userPayload.youtubeThirdUrl !== undefined) token.youtubeThirdUrl = userPayload.youtubeThirdUrl;
          if (userPayload.youtubeFourthUrl !== undefined) token.youtubeFourthUrl = userPayload.youtubeFourthUrl;

          if (userPayload.statFollowers !== undefined) token.statFollowers = userPayload.statFollowers;
          if (userPayload.statMedia !== undefined) token.statMedia = userPayload.statMedia;
          if (userPayload.statRegion !== undefined) token.statRegion = userPayload.statRegion;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.role = token.role as any;
        session.user.username = token.username as string;
        session.user.bio = token.bio as string | null;
        session.user.profileVisibility = token.profileVisibility as any;
        session.user.twitchUsername = token.twitchUsername as string | null;
        session.user.discordWebhookUrl = token.discordWebhookUrl as string | null;
        session.user.profileBannerUrl = token.profileBannerUrl as string | null;

        session.user.showToWatchList = token.showToWatchList as boolean;
        session.user.showWatchingList = token.showWatchingList as boolean;
        session.user.showWatchedList = token.showWatchedList as boolean;
        session.user.showDroppedList = token.showDroppedList as boolean;

        // 👇 REPASSANDO PARA O FRONTEND
        session.user.youtubeMainUrl = token.youtubeMainUrl as string | null;
        session.user.youtubeSecondUrl = token.youtubeSecondUrl as string | null;
        session.user.youtubeThirdUrl = token.youtubeThirdUrl as string | null;
        session.user.youtubeFourthUrl = token.youtubeFourthUrl as string | null;

        session.user.statFollowers = token.statFollowers as string | null;
        session.user.statMedia = token.statMedia as string | null;
        session.user.statRegion = token.statRegion as string | null;
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