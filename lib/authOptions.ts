import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitchProvider from "next-auth/providers/twitch";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { UserRole, ProfileVisibility } from "@prisma/client"; 
import { v4 as uuidv4 } from 'uuid';

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  username: string;
  role: UserRole;
  bio?: string | null;
  profileVisibility: ProfileVisibility;
  image?: string | null; // Garantir que a imagem está na interface
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
          image: profile.picture, // O OAuth já fornece a imagem
          username: profile.email.split('@')[0] + '-' + uuidv4().substring(0, 4),
          role: UserRole.VISITOR, 
          bio: null,
          profileVisibility: ProfileVisibility.PUBLIC,
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
          image: profile.picture, // O OAuth já fornece a imagem
          username: profile.preferred_username + '-' + uuidv4().substring(0, 4),
          role: UserRole.VISITOR,
          bio: null,
          profileVisibility: ProfileVisibility.PUBLIC,
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
            
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
                bio: user.bio,
                profileVisibility: user.profileVisibility,
                image: user.image, // Passa a imagem da BD
            };
        }
     }),
  ],
  pages: { signIn: "/auth/signin", },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // --- [CORREÇÃO PRINCIPAL AQUI] ---
    async jwt({ token, user, trigger, session }) {
      
      // 1. No login inicial (objeto 'user' existe)
      if (user) {
         token.id = user.id;
         token.username = user.username;
         token.role = user.role;
         token.bio = user.bio;
         token.profileVisibility = user.profileVisibility;
         token.image = user.image; // Guarda a imagem no token
      }

      // 2. Na atualização da sessão (ex: updateSession() chamado no dashboard)
      // O 'trigger' será "update" e o objeto 'session' conterá os novos dados
      if (trigger === "update" && session?.user) {
        // Atualiza o token com os novos dados passados pela função updateSession
        token.bio = session.user.bio;
        token.profileVisibility = session.user.profileVisibility;
        token.image = session.user.image;
      }

      return token; // Retorna o token atualizado
    },
    
    async session({ session, token }) {
      // Esta função passa os dados do TOKEN (atualizado acima) para a SESSÃO do cliente
      if (session.user) {
        const sessionUser = session.user as SessionUser;
        sessionUser.id = token.id as string;
        sessionUser.username = token.username as string;
        sessionUser.role = token.role as UserRole;
        sessionUser.bio = token.bio as string | null;
        sessionUser.profileVisibility = token.profileVisibility as ProfileVisibility;
        sessionUser.image = token.image as string | null; // Passa a imagem do token para a sessão
      }
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

