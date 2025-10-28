// lib/authOptions.ts
import { NextAuthOptions, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitchProvider from "next-auth/providers/twitch";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter"; // Adapter v1
import prisma from "@/lib/prisma"; // Assumindo que prisma está em lib/prisma
import bcrypt from "bcrypt";

// Tipo estendido (igual)
interface ExtendedUser extends NextAuthUser {
  id: string;
  username: string;
}

// Define e EXPORTA authOptions aqui
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) { throw new Error("Email e senha obrigatórios"); }
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.hashedPassword) { throw new Error("Utilizador não encontrado ou sem senha"); }
        const isPasswordCorrect = await bcrypt.compare( credentials.password, user.hashedPassword );
        if (!isPasswordCorrect) { throw new Error("Senha incorreta"); }
        return user;
      },
    }),
  ],

  pages: {
    signIn: "/auth/signin",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = user as ExtendedUser;
        token.id = dbUser.id;
        token.username = dbUser.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
         // @ts-ignore
        session.user.id = token.id as string;
         // @ts-ignore
        session.user.username = token.username as string;
      }
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET, // Usa NEXTAUTH_SECRET na v4
};

// Não exporte mais nada daqui
