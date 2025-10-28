import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitchProvider from "next-auth/providers/twitch";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter"; // Adapter v1
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

// Tipo estendido para incluir as propriedades que adicionamos aos callbacks
interface ExtendedUser extends NextAuthUser {
  id: string;
  username: string;
}

// Define as opções de configuração do NextAuth v4 aqui dentro
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma), // Usa o adapter v1 compatível com Prisma

  providers: [
    GoogleProvider({
      // ! garante ao TypeScript que estas variáveis existem (serão lidas do .env)
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials", // Nome que aparece na página de login (se não for personalizada)
      // Define os campos esperados do formulário de login
      credentials: {
        email: { label: "Email", type: "text", placeholder: "seu@email.com" },
        password: { label: "Password", type: "password" },
      },
      // Lógica para verificar as credenciais
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        // Busca o utilizador na base de dados pelo email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Verifica se o utilizador existe e tem uma senha hash (não veio do Google/Twitch)
        if (!user || !user.hashedPassword) {
          throw new Error("Utilizador não encontrado ou registado com outro método");
        }

        // Compara a senha enviada com a senha hash guardada
        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordCorrect) {
          throw new Error("Senha incorreta");
        }

        // Se tudo estiver correto, retorna o objeto 'user' do Prisma
        // O NextAuth usará este objeto para criar a sessão/token
        return user;
      },
    }),
  ],

  // Define a nossa página de login personalizada
  pages: {
    signIn: "/auth/signin",
    // Poderia adicionar outras como signOut, error, etc.
  },

  // Estratégia de Sessão: JWT é necessário para os callbacks funcionarem corretamente com o adapter
  session: {
    strategy: "jwt",
  },

  // Callbacks para personalizar o token JWT e o objeto Session
  callbacks: {
    // Chamado quando um token JWT é criado ou atualizado
    async jwt({ token, user }) {
      // 'user' só está disponível no login inicial.
      // Adicionamos o id e username do utilizador (vindo do authorize ou adapter) ao token.
      if (user) {
        // Fazemos cast seguro para o nosso tipo estendido
        const dbUser = user as ExtendedUser;
        token.id = dbUser.id;
        token.username = dbUser.username;
      }
      return token; // Retorna o token (possivelmente modificado)
    },
    // Chamado quando uma sessão é acedida
    async session({ session, token }) {
      // Adicionamos as informações que guardámos no token (id, username)
      // ao objeto session.user que o frontend recebe.
      if (session.user) {
        // Usamos @ts-ignore porque o tipo padrão de session.user no NextAuth v4
        // não inclui id ou username.
         // @ts-ignore
        session.user.id = token.id as string;
         // @ts-ignore
        session.user.username = token.username as string;
      }
      return session; // Retorna a sessão (possivelmente modificada)
    },
  },

  // Ativa logs detalhados apenas em ambiente de desenvolvimento
  debug: process.env.NODE_ENV === "development",
  // Segredo usado para assinar os JWTs e cookies de sessão
  secret: process.env.NEXTAUTH_SECRET,
};

// Cria o handler do NextAuth com as opções definidas
const handler = NextAuth(authOptions);

// Exporta os handlers GET e POST para o Next.js App Router
export { handler as GET, handler as POST };

