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

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Limpei a lógica do Google/Twitch que não existe mais
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        // Se você exige verificação de e-mail, mantenha isso. Se não, pode remover.
        if (!dbUser?.emailVerified) {
          console.log("Login recusado: Email não verificado", user.email);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? null;
        token.picture = user.image ?? null;
        token.role = user.role;
        token.username = user.username;
        token.bio = user.bio ?? null;
        token.profileVisibility = user.profileVisibility;
        token.twitchUsername = user.twitchUsername ?? null;
        token.showToWatchList = user.showToWatchList;
        token.showWatchingList = user.showWatchingList;
        token.showWatchedList = user.showWatchedList;
        token.showDroppedList = user.showDroppedList;
        token.profileBannerUrl = user.profileBannerUrl ?? null;
        token.discordWebhookUrl = user.discordWebhookUrl ?? null;
      }

      if (trigger === "update" && session) {
        const userPayload = session.user;
        if (userPayload) {
          token.name = userPayload.name ?? null;
          token.picture = userPayload.image ?? null;
          token.bio = userPayload.bio ?? null;
          token.profileVisibility = userPayload.profileVisibility;
          token.showToWatchList = userPayload.showToWatchList;
          token.showWatchingList = userPayload.showWatchingList;
          token.showWatchedList = userPayload.showWatchedList;
          token.showDroppedList = userPayload.showDroppedList;
          token.profileBannerUrl = userPayload.profileBannerUrl ?? null;
          
          if (userPayload.discordWebhookUrl !== undefined) {
             token.discordWebhookUrl = userPayload.discordWebhookUrl;
          }
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
        session.user.showToWatchList = token.showToWatchList as boolean;
        session.user.showWatchingList = token.showWatchingList as boolean;
        session.user.showWatchedList = token.showWatchedList as boolean;
        session.user.showDroppedList = token.showDroppedList as boolean;
        session.user.profileBannerUrl = token.profileBannerUrl as string | null;
        session.user.discordWebhookUrl = token.discordWebhookUrl as string | null;
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