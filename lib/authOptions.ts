// lib/authOptions.ts (Corrigido)



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

          profileBannerUrl: null, // <-- ADICIONADO AQUI

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

          profileBannerUrl: null, // <-- ADICIONADO AQUI

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

        // @ts-ignore - O 'user' do Prisma corresponde ao 'User' do NextAuth

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



      if (user) {

        // @ts-ignore

        token.id = user.id;

        token.name = user.name ?? null;

        token.picture = user.image ?? null;

        // @ts-ignore

        token.role = user.role;

        // @ts-ignore

        token.username = user.username;

        // @ts-ignore

        token.bio = user.bio ?? null;

        // @ts-ignore

        token.profileVisibility = user.profileVisibility;

        // @ts-ignore

        token.twitchUsername = user.twitchUsername ?? null;

        // @ts-ignore

        token.showToWatchList = user.showToWatchList;

        // @ts-ignore

        token.showWatchingList = user.showWatchingList;

        // @ts-ignore

        token.showWatchedList = user.showWatchedList;

        // @ts-ignore

        token.showDroppedList = user.showDroppedList;

        // @ts-ignore

        token.profileBannerUrl = user.profileBannerUrl ?? null; // <-- ADICIONADO AQUI

      }



      if (trigger === "update" && session) {

        // @ts-ignore

        const userPayload = session.user;

        if (userPayload) {

          token.name = userPayload.name ?? null;

          token.picture = userPayload.image ?? null;

          // @ts-ignore

          token.bio = userPayload.bio ?? null;

          // @ts-ignore

          token.profileVisibility = userPayload.profileVisibility;

          // @ts-ignore

          token.showToWatchList = userPayload.showToWatchList;

          // @ts-ignore

          token.showWatchingList = userPayload.showWatchingList;

          // @ts-ignore

          token.showWatchedList = userPayload.showWatchedList;

          // @ts-ignore

          token.showDroppedList = userPayload.showDroppedList;

          // @ts-ignore

          token.profileBannerUrl = userPayload.profileBannerUrl ?? null; // <-- ADICIONADO AQUI

        }

      }



      return token;

    },



    async session({ session, token }) {

      if (token && session.user) {

        // @ts-ignore

        session.user.id = token.id;

        session.user.name = token.name;

        session.user.image = token.picture;

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

        session.user.profileBannerUrl = token.profileBannerUrl; // <-- ADICIONADO AQUI

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