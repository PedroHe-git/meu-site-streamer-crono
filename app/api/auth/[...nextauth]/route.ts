import NextAuth from "next-auth";
// --- [MUDANÇA AQUI] Importa do ficheiro centralizado ---
import { authOptions } from "@/lib/authOptions"; // Importa as opções de lib/authOptions.ts
// --- [FIM MUDANÇA] ---

// NÃO exporte authOptions daqui
// A definição de authOptions está agora em lib/authOptions.ts

// Cria o handler usando as opções importadas
const handler = NextAuth(authOptions);

// Exporta APENAS os handlers GET e POST, como esperado pelo Next.js App Router
export { handler as GET, handler as POST };

