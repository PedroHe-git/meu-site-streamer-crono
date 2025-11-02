import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitchProvider from "next-auth/providers/twitch";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { UserRole, ProfileVisibility, Prisma } from "@prisma/client"; // <-- Importe o Prisma
import { v4 as uuidv4 } from 'uuid';

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
          image: profile.picture, // <-- Twitch já fornece a imagem
          username: profile.preferred_username + '-' + uuidv4().substring(0, 4),
          role: UserRole.VISITOR,
          bio: null,
          profileVisibility: ProfileVisibility.PUBLIC,
          twitchUsername: profile.preferred_username, 
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
                image: user.image,
                twitchUsername: user.twitchUsername,
            };
        }
     }),
  ],
  pages: { signIn: "/auth/signin", },
  session: { strategy: "jwt" },

  events: {
    // --- [ INÍCIO DA MODIFICAÇÃO ] ---
    async linkAccount({ user, account, profile }) {
      // Quando o utilizador vincula uma conta (ex: Twitch)
      if (account.provider === "twitch") {
        
        // Prepara os dados para atualizar no Prisma
        const dataToUpdate: Prisma.UserUpdateInput = {};

        // 1. Adiciona o username da Twitch
        // @ts-ignore
        dataToUpdate.twitchUsername = profile.preferred_username || null;

        // 2. Verifica a imagem
        // @ts-ignore
        const twitchPicture = profile.picture as string | null;

        // SE o utilizador NÃO tiver uma imagem personalizada (user.image for null)
        // E SE a Twitch forneceu uma imagem (twitchPicture não for null)
        // ENTÃO, atualiza a imagem do utilizador.
        if (!user.image && twitchPicture) {
          dataToUpdate.image = twitchPicture;
        }

        // 3. Atualiza o utilizador na base de dados
        await prisma.user.update({
          where: { id: user.id },
          data: dataToUpdate,
        });
      }
    }
    // --- [ FIM DA MODIFICAÇÃO ] ---
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
      }

      // --- [ INÍCIO DA MODIFICAÇÃO ] ---
      // Quando uma nova conta é VINCULADA (ex: clicar em "Vincular Twitch" no dashboard)
      // O 'profile' e 'account' estão disponíveis neste trigger
      if (trigger === "update" && account && profile) {
        
        if (account.provider === "twitch") {
          // @ts-ignore
          token.twitchUsername = profile.preferred_username;

          // Atualiza o token com a imagem da Twitch, SE o token não tiver uma
          // @ts-ignore
          const twitchPicture = profile.picture as string | null;
          if (!token.image && twitchPicture) {
            token.image = twitchPicture;
          }
        }
      }
      // --- [ FIM DA MODIFICAÇÃO ] ---

      // Quando a sessão é atualizada manualmente (ex: salvar bio ou novo avatar)
      if (trigger === "update" && session?.user) {
        if (session.user.bio !== undefined) {
          token.bio = session.user.bio;
        }
        if (session.user.profileVisibility !== undefined) {
          token.profileVisibility = session.user.profileVisibility;
        }
        // Se a sessão for atualizada com uma nova imagem (do upload), ela tem prioridade
        if (session.user.image !== undefined) {
            token.image = session.user.image;
        }
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
      }
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};