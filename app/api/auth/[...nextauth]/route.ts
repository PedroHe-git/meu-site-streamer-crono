import NextAuth from "next-auth";
// Importa as opções do novo ficheiro centralizado
import { authOptions } from "@/lib/auth";

// Usa as opções importadas para configurar o NextAuth
const handler = NextAuth(authOptions);

// Exporta os handlers GET e POST necessários para as rotas API do Next.js
export { handler as GET, handler as POST };

