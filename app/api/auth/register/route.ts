// app/api/auth/register/route.ts (Atualizado)

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
// Lembre-se de importar o seu 'sendVerificationEmail' se o estiver a usar
// import { sendVerificationEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, password } = body;

    if (!email || !username || !password) {
      return new NextResponse("Campos em falta", { status: 400 });
    }

    // --- [CORREÇÃO] ---
    const lowerCaseUsername = username.toLowerCase();
    // --- [FIM DA CORREÇÃO] ---

    // Verifica se o email ou o USERNAME EM MINÚSCULAS já existem
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingUserByEmail) {
      return new NextResponse("Email já está em uso", { status: 409 });
    }

    const existingUserByUsername = await prisma.user.findUnique({
      // --- [CORREÇÃO] ---
      where: { username: lowerCaseUsername },
      // --- [FIM DA CORREÇÃO] ---
    });
    if (existingUserByUsername) {
      return new NextResponse("Nome de utilizador já está em uso", { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    // (A sua lógica de token de verificação...)
    // const verificationToken = uuidv4();
    // ...

    const user = await prisma.user.create({
      data: {
        email,
        // --- [CORREÇÃO] ---
        username: lowerCaseUsername, // Guarda o username em minúsculas
        // --- [FIM DA CORREÇÃO] ---
        hashedPassword,
        // emailVerified: null, 
        // verificationToken: verificationToken,
        // verificationTokenExpires: new Date(Date.now() + 3600000), // 1 hora
        
        // Valores padrão que definimos para o 'profile'
        role: 'VISITOR', 
        profileVisibility: 'PUBLIC',
        showToWatchList: true,
        showWatchingList: true,
        showWatchedList: true,
        showDroppedList: true,
      },
    });
    
    // (A sua lógica de 'sendVerificationEmail' viria aqui)
    // await sendVerificationEmail(email, verificationToken);

    return NextResponse.json({ message: "Utilizador registado. Por favor, verifique o seu email." }, { status: 201 });

  } catch (error) {
    console.error("[REGISTER_POST]", error);
    return new NextResponse("Erro Interno", { status: 500 });
  }
}