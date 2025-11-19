// app/api/users/search/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from '@/lib/prisma';
import { UserRole } from "@prisma/client";
import { checkRateLimit } from "@/lib/ratelimit";
import { headers } from "next/headers";

export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // 1. Segurança: Rate Limit (30 buscas por minuto por IP)
    const headersList = headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    
    if (!checkRateLimit(ip, 30, 60 * 1000)) {
      return new NextResponse(JSON.stringify({ error: "Muitas pesquisas. Aguarde um pouco." }), { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]); 
    }

    // 2. Busca Segura (Apenas Criadores)
    const creators = await prisma.user.findMany({
      where: {
        role: UserRole.CREATOR,
        username: {
            contains: query,
            mode: 'insensitive', 
        },
      },
      // 3. Privacidade: Retornar APENAS dados públicos
      select: { 
        username: true,
        name: true,
        image: true,
        // NUNCA selecionar email, hashedPassword, etc.
      },
      take: 10, 
      orderBy: {
         name: 'asc' 
      }
    });

    return NextResponse.json(creators);

  } catch (error) {
    console.error("Erro ao pesquisar criadores:", error);
    return new NextResponse(JSON.stringify({ error: "Erro interno ao pesquisar" }), { status: 500 });
  }
}