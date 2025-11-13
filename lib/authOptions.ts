// lib/authOptions.ts

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
          profileBannerUrl: null,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        const baseName = profile.email.split('@')[0].toLowerCase();
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: UserRole.VISITOR,
          username: `${baseName}_${randomSuffix}`,
          twitchUsername: null,
          bio: null,
          profileVisibility: 'PUBLIC',
          showToWatchList: true,
          showWatchingList: true,
          showWatchedList: true,
          showDroppedList: true,
          profileBannerUrl: null,
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
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {

        session.user.id = token.id;
        session.user.name = token.name;
        session.user.image = token.picture;

        session.user.role = token.role;

        session.user.username = token.username;

        session.user.bio = token.bio;

        session.user.profileVisibility = token.profileVisibility;

        session.user.twitchUsername = token.twitchUsername;

        session.user.showToWatchList = token.showToWatchList;

        session.user.showWatchingList = token.showWatchingList;

        session.user.showWatchedList = token.showWatchedList;

        session.user.showDroppedList = token.showDroppedList;

        session.user.profileBannerUrl = token.profileBannerUrl;
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