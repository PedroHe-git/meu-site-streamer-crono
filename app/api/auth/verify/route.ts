// app/api/auth/verify/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// O import 'url' foi REMOVIDO

// --- [ADIÇÕES CORRIGIDAS] ---
export const runtime = 'nodejs'; // Força o Node.js

// --- [FIM DAS ADIÇÕES] ---

export async function GET(request: Request) {

  console.log("VERIFY API: Rota de verificação iniciada (Runtime: Node.js, Region: gru1).");
  const { searchParams } = new URL(request.url); // Funciona sem o import
  const token = searchParams.get('token');

  if (!token) {
    console.error("VERIFY API: Erro - Token faltando.");
    return NextResponse.redirect(new URL('/auth/signin?error=token_missing', request.url));
  }

  try {
    console.log(`VERIFY API: Buscando token no banco: ${token}`);
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: token },
    });

    console.log("VERIFY API: Token encontrado:", verificationToken);

    if (!verificationToken) {
      console.error("VERIFY API: Erro - Token inválido.");
      return NextResponse.redirect(new URL('/auth/signin?error=token_invalid', request.url));
    }

    const hasExpired = new Date(verificationToken.expires) < new Date();
    if (hasExpired) {
      console.error("VERIFY API: Erro - Token expirado.");
      return NextResponse.redirect(new URL('/auth/signin?error=token_expired', request.url));
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      console.error("VERIFY API: Erro - Usuário não encontrado.");
      return NextResponse.redirect(new URL('/auth/signin?error=user_not_found', request.url));
    }

    console.log(`VERIFY API: Atualizando usuário: ${user.id}`);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
      },
    });

    console.log(`VERIFY API: Deletando token...`);
    await prisma.verificationToken.delete({
      where: { token: token },
    });

    console.log("VERIFY API: Sucesso! Redirecionando para signin.");
    return NextResponse.redirect(new URL('/auth/signin?verified=true', request.url));

  } catch (error) {
    console.error("VERIFY API: Erro fatal no bloco try/catch:", error);
    return NextResponse.redirect(new URL('/auth/signin?error=verification_failed', request.url));
  }
}