import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitchProvider from "next-auth/providers/twitch";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";

// Interface para dados que QUEREMOS no token/sessão
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  // image?: string | null; // <-- REMOVIDO
  username: string;
  role: UserRole;
}

export const authOptions: NextAuthOptions = {
  // Adapter ainda é necessário para ler/escrever Users/Accounts (OAuth, Credentials lookup)
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET!, }),
    TwitchProvider({ clientId: process.env.TWITCH_CLIENT_ID!, clientSecret: process.env.TWITCH_CLIENT_SECRET!, }),
    CredentialsProvider({
        name: "Credentials",
        credentials: { email: { label: "Email", type: "text" }, password: { label: "Password", type: "password" }, },
        async authorize(credentials) {
            // Mantém authorize retornando objeto mínimo (sem imagem)
            console.log("--- [Authorize Start - Minimal Return] ---");
            if (!credentials?.email || !credentials?.password) { throw new Error("Email e senha são obrigatórios"); }
            const user = await prisma.user.findUnique({ where: { email: credentials.email }, });
            if (!user || !user.hashedPassword) { throw new Error("Utilizador não encontrado ou registado com outro método"); }
            const isPasswordCorrect = await bcrypt.compare( credentials.password, user.hashedPassword );
            if (!isPasswordCorrect) { throw new Error("Senha incorreta"); }
            console.log(`[Authorize Success] Autenticação OK para ${credentials.email}`);
            // Retorna apenas os campos necessários para o JWT/Session (SEM imagem)
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                // image: user.image, // <-- NÃO RETORNA IMAGEM
                // Passa username e role para o callback JWT
                username: user.username,
                role: user.role,
            };
        }
     }),
  ],
  pages: { signIn: "/auth/signin", },

  // --- [MUDANÇA AQUI] Volta para JWT ---
  session: {
    strategy: "jwt",
    // maxAge e updateAge não se aplicam a JWT da mesma forma
  },
  // --- [FIM MUDANÇA] ---

  // --- [MUDANÇA AQUI] Callbacks reativados e ajustados ---
  callbacks: {
    // Adiciona dados ao token JWT a partir do objeto retornado por authorize (ou adapter para OAuth)
    async jwt({ token, user }) {
      console.log("--- [JWT Callback Start - JWT Strategy] ---");
      // 'user' aqui é o objeto retornado por authorize ou criado pelo adapter
      if (user) {
         console.log("[JWT Callback] User recebido:", user);
         // Adiciona apenas os campos seguros e necessários ao token
         token.id = user.id;
         token.username = (user as any).username; // Assume que username está presente
         token.role = (user as any).role;       // Assume que role está presente
         // NÃO adiciona token.picture = user.image;
      }
       console.log("[JWT Callback] Token final:", token);
       console.log("--- [JWT Callback End - JWT Strategy] ---");
      return token;
    },
    // Adiciona dados do token ao objeto session que o frontend recebe
    async session({ session, token }) {
       console.log("--- [Session Callback Start - JWT Strategy] ---");
       console.log("[Session Callback] Token recebido:", token);
       console.log("[Session Callback] Sessão inicial:", session);
      // Garante que session.user existe antes de adicionar propriedades
      if (session.user) {
        // Tipa session.user para incluir as nossas propriedades personalizadas
        const sessionUser = session.user as SessionUser;
        sessionUser.id = token.id as string;
        sessionUser.username = token.username as string;
        sessionUser.role = token.role as UserRole;
        // NÃO adiciona sessionUser.image = token.picture;
      }
       console.log("[Session Callback] Sessão final:", session);
       console.log("--- [Session Callback End - JWT Strategy] ---");
      return session;
    },
  },
  // --- [FIM MUDANÇA] ---

  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET, // Segredo para v4
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };