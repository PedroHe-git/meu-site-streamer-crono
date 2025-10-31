// app/api/auth/verify/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { URL } from 'url'; // Importa a classe URL

export const runtime = 'nodejs';

export async function GET(request: Request) {

  console.log("VERIFY API: Rota de verificação iniciada.");
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    console.error("VERIFY API: Erro - Token faltando.");
    // Redireciona para o login com um erro de token faltando
    return NextResponse.redirect(new URL('/auth/signin?error=token_missing', request.url));
  }

  try {
    console.log(`VERIFY API: Buscando token no banco: ${token}`);
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: token },
    });

    console.log("VERIFY API: Token encontrado:", verificationToken);

    if (!verificationToken) {
      // Token não existe
      console.error("VERIFY API: Erro - Token inválido.");
      return NextResponse.redirect(new URL('/auth/signin?error=token_invalid', request.url));
    }

    // 2. Verifica se o token expirou
    const hasExpired = new Date(verificationToken.expires) < new Date();
    if (hasExpired) {
      return NextResponse.redirect(new URL('/auth/signin?error=token_expired', request.url));
    }

    // 3. Encontra o usuário associado ao token
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      // Isso não deve acontecer, mas é uma boa verificação
      return NextResponse.redirect(new URL('/auth/signin?error=user_not_found', request.url));
    }

    // 4. Se tudo estiver OK, atualiza o usuário
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(), // Marca o email como verificado
      },
    });

    // 5. Deleta o token de verificação para que não possa ser usado novamente
    await prisma.verificationToken.delete({
      where: { token: token },
    });

    // 6. Redireciona para o login com uma mensagem de sucesso
    return NextResponse.redirect(new URL('/auth/signin?verified=true', request.url));

  } catch (error) {
    console.error("VERIFY API: Erro fatal no bloco try/catch:", error);
    return NextResponse.redirect(new URL('/auth/signin?error=verification_failed', request.url));
  }
}