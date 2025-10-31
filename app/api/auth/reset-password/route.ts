// app/api/auth/reset-password/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

// Configura o runtime e a região (necessário para o Prisma no Vercel)
export const runtime = 'nodejs';


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // --- 1. Validação do Input ---
    if (!token || !password) {
      return new NextResponse(JSON.stringify({ error: "Token e nova senha são obrigatórios" }), { status: 400 });
    }

    if (password.length < 6) {
      return new NextResponse(JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }), { status: 400 });
    }

    // --- 2. Encontra o Token no Banco ---
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: token },
    });

    if (!resetToken) {
      return new NextResponse(JSON.stringify({ error: "Token inválido" }), { status: 404 });
    }

    // --- 3. Verifica se o Token Expirou ---
    const hasExpired = new Date(resetToken.expires) < new Date();
    if (hasExpired) {
      // Opcional: Deleta o token expirado para limpeza
      await prisma.passwordResetToken.delete({ where: { token } });
      return new NextResponse(JSON.stringify({ error: "Token expirado. Por favor, solicite um novo link." }), { status: 410 }); // 410 Gone
    }

    // --- 4. Encontra o Usuário ---
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      // Caso estranho (usuário foi deletado mas o token não)
      return new NextResponse(JSON.stringify({ error: "Usuário não encontrado" }), { status: 404 });
    }

    // --- 5. Atualiza a Senha ---
    // Faz o hash da nova senha
    const newHashedPassword = await bcrypt.hash(password, 10);

    // Atualiza o usuário no banco
    await prisma.user.update({
      where: { id: user.id },
      data: {
        hashedPassword: newHashedPassword,
        // Também verificamos o email, caso ele tenha se registrado mas nunca verificado
        emailVerified: user.emailVerified || new Date(), 
      },
    });

    // --- 6. Deleta o Token (MUITO IMPORTANTE) ---
    // Impede que o link seja usado uma segunda vez
    await prisma.passwordResetToken.delete({
      where: { token: token },
    });

    // --- 7. Sucesso ---
    return NextResponse.json({ message: "Senha redefinida com sucesso!" }, { status: 200 });

  } catch (error) {
    console.error("Erro na API de reset-password:", error);
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor." }), { status: 500 });
  }
}