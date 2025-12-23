import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma"; // 👈 IMPORTANTE: Usar o singleton, não criar new PrismaClient()
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias (Ajuda o banco a dormir ao evitar re-auth frequente)
  },
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
  callbacks: {
    // Callback executado ao tentar login
    async signIn({ user, account }) {
      // ⚡ OTIMIZAÇÃO: Removemos a consulta ao banco aqui para não acordar o Neon desnecessariamente.
      // Se você precisar reativar a verificação de e-mail no futuro, descomente a lógica abaixo,
      // mas saiba que isso fará uma leitura no banco a cada login.
      
      /*
      if (account?.provider === "credentials") {
         // Lógica de verificação de e-mail removida para performance
      }
      */
      return true;
    },

    // Callback executado ao criar/atualizar o token JWT
    async jwt({ token, user, trigger, session }) {
      // 1. CARREGAMENTO INICIAL (No momento do Login)
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.picture = user.image;
        
        // Campos personalizados (Usando 'as any' pois o User padrão do NextAuth não tem esses campos)
        const u = user as any;
        
        token.role = u.role;
        token.username = u.username;
        token.bio = u.bio;
        token.profileVisibility = u.profileVisibility;
        token.twitchUsername = u.twitchUsername;
        token.discordWebhookUrl = u.discordWebhookUrl;
        token.profileBannerUrl = u.profileBannerUrl;
        
        // Listas
        token.showToWatchList = u.showToWatchList;
        token.showWatchingList = u.showWatchingList;
        token.showWatchedList = u.showWatchedList;
        token.showDroppedList = u.showDroppedList;

        // Youtube & Stats
        token.youtubeMainUrl = u.youtubeMainUrl;
        token.youtubeSecondUrl = u.youtubeSecondUrl;
        token.youtubeThirdUrl = u.youtubeThirdUrl;
        token.youtubeFourthUrl = u.youtubeFourthUrl;
        
        token.statFollowers = u.statFollowers;
        token.statMedia = u.statMedia;
        token.statRegion = u.statRegion;
        token.amazonWishlistUrl = u.amazonWishlistUrl;
      }

      // 2. ATUALIZAÇÃO VIA CLIENTE (Quando chamamos update() no frontend)
      if (trigger === "update" && session?.user) {
        const userPayload = session.user;
        
        // Atualiza apenas o que foi enviado
        if (userPayload.name !== undefined) token.name = userPayload.name;
        if (userPayload.image !== undefined) token.picture = userPayload.image;
        if (userPayload.bio !== undefined) token.bio = userPayload.bio;
        if (userPayload.profileVisibility !== undefined) token.profileVisibility = userPayload.profileVisibility;
        if (userPayload.profileBannerUrl !== undefined) token.profileBannerUrl = userPayload.profileBannerUrl;
        
        if (userPayload.discordWebhookUrl !== undefined) token.discordWebhookUrl = userPayload.discordWebhookUrl;
        if (userPayload.twitchUsername !== undefined) token.twitchUsername = userPayload.twitchUsername;

        // Atualização dos novos campos
        if (userPayload.youtubeMainUrl !== undefined) token.youtubeMainUrl = userPayload.youtubeMainUrl;
        if (userPayload.youtubeSecondUrl !== undefined) token.youtubeSecondUrl = userPayload.youtubeSecondUrl;
        if (userPayload.youtubeThirdUrl !== undefined) token.youtubeThirdUrl = userPayload.youtubeThirdUrl;
        if (userPayload.youtubeFourthUrl !== undefined) token.youtubeFourthUrl = userPayload.youtubeFourthUrl;

        if (userPayload.statFollowers !== undefined) token.statFollowers = userPayload.statFollowers;
        if (userPayload.statMedia !== undefined) token.statMedia = userPayload.statMedia;
        if (userPayload.statRegion !== undefined) token.statRegion = userPayload.statRegion;

        if (userPayload.amazonWishlistUrl !== undefined) token.amazonWishlistUrl = userPayload.amazonWishlistUrl;
        
        // Atualização de toggles de lista
        if (userPayload.showToWatchList !== undefined) token.showToWatchList = userPayload.showToWatchList;
        if (userPayload.showWatchingList !== undefined) token.showWatchingList = userPayload.showWatchingList;
        if (userPayload.showWatchedList !== undefined) token.showWatchedList = userPayload.showWatchedList;
        if (userPayload.showDroppedList !== undefined) token.showDroppedList = userPayload.showDroppedList;
      }
      
      return token;
    },

    // Callback executado sempre que o useSession é chamado no frontend
    async session({ session, token }) {
      if (session.user && token) {
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

        // Repassando novos campos para o Frontend
        session.user.youtubeMainUrl = token.youtubeMainUrl as string | null;
        session.user.youtubeSecondUrl = token.youtubeSecondUrl as string | null;
        session.user.youtubeThirdUrl = token.youtubeThirdUrl as string | null;
        session.user.youtubeFourthUrl = token.youtubeFourthUrl as string | null;

        session.user.statFollowers = token.statFollowers as string | null;
        session.user.statMedia = token.statMedia as string | null;
        session.user.statRegion = token.statRegion as string | null;

        session.user.amazonWishlistUrl = token.amazonWishlistUrl as string | null;
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