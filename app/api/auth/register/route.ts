// app/api/auth/register/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
// [IMPORTANTE] Importa a função que você criou
import { sendVerificationEmail } from "@/lib/email"; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // O 'name' vem do formulário (que corrigimos antes)
    const { name, email, username, password } = body; 

    if (!name || !email || !username || !password) {
      return new NextResponse(JSON.stringify({ error: "Campos em falta" }), { status: 400 });
    }

    const lowerCaseUsername = username.toLowerCase();

    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingUserByEmail) {
      return new NextResponse(JSON.stringify({ error: "Email já está em uso" }), { status: 409 });
    }

    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: lowerCaseUsername },
    });
    if (existingUserByUsername) {
      return new NextResponse(JSON.stringify({ error: "Nome de utilizador já está em uso" }), { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // --- [INÍCIO DA LÓGICA CORRIGIDA] ---

    // 1. Cria o usuário
    const user = await prisma.user.create({
      data: {
        name, // <-- Salva o nome
        email,
        username: lowerCaseUsername,
        hashedPassword,
        emailVerified: null, // <-- Fica nulo até ser verificado
        role: 'VISITOR', // <-- Força o role VISITOR
        profileVisibility: 'PUBLIC',
        showToWatchList: true,
        showWatchingList: true,
        showWatchedList: true,
        showDroppedList: true,
      },
    });

    // 2. Gera o token de verificação
    const verificationToken = uuidv4();
    const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hora

    // 3. Salva o token na tabela VerificationToken (o seu app/api/auth/verify/route.ts já usa esta tabela)
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: expires,
      },
    });
    
    // 4. Envia o email de verificação
    await sendVerificationEmail(email, user.name || user.username, verificationToken);

    // --- [FIM DA LÓGICA CORRIGIDA] ---

    return NextResponse.json({ message: "Utilizador registado. Por favor, verifique o seu email." }, { status: 201 });

  } catch (error) {
    console.error("[REGISTER_POST]", error);
    // Retorna o erro específico do envio de email, se houver
    if (error instanceof Error && error.message.includes("Falha ao enviar")) {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}