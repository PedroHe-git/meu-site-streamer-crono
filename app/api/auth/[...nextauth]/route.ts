// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
// 1. Importe as opções do seu arquivo da pasta 'lib'
import { authOptions } from "@/lib/authOptions"; 

// 2. Crie o handler usando as opções importadas
const handler = NextAuth(authOptions);

// 3. Exporte APENAS os handlers GET e POST
export { handler as GET, handler as POST };