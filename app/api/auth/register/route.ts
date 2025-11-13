// app/api/auth/register/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "@/lib/email"; 
import { z } from "zod"; // [NOVO] Importar Zod

// [NOVO] Esquema de Validação
const registerSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  email: z.string().email("Formato de email inválido."),
  username: z.string()
    .min(3, "O utilizador deve ter no mínimo 3 caracteres.")
    .regex(/^[a-z0-9_]+$/, "O utilizador deve conter apenas letras minúsculas, números ou underline."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."), // Defina sua política de senha
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // [NOVO] Validar os dados antes de processar
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const formattedErrors = validation.error.format();
      // Exemplo: se o erro for no email, retorna o erro do email, senão o primeiro erro geral
      const errorMessage = formattedErrors.email?._errors[0] 
                        || formattedErrors.username?._errors[0]
                        || formattedErrors.password?._errors[0]
                        || "Dados inválidos";
                        
      return new NextResponse(
        JSON.stringify({ error: errorMessage }), 
        { status: 400 }
      );
    }

    // Se passou na validação, usamos os dados validados
    const { name, email, username, password } = validation.data;

    const lowerCaseUsername = username.toLowerCase();

    // ... (Restante da lógica de verificação de email/username existente mantém-se igual) ...
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingUserByEmail) {
      // Por segurança, idealmente responderia algo genérico, mas para este projeto pode manter:
      return new NextResponse(JSON.stringify({ error: "Email já está em uso" }), { status: 409 });
    }

    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: lowerCaseUsername },
    });
    if (existingUserByUsername) {
      return new NextResponse(JSON.stringify({ error: "Nome de utilizador já está em uso" }), { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // 1. Cria o usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        username: lowerCaseUsername,
        hashedPassword,
        emailVerified: null,
        role: 'VISITOR',
        profileVisibility: 'PUBLIC',
        showToWatchList: true,
        showWatchingList: true,
        showWatchedList: true,
        showDroppedList: true,
      },
    });

    // 2. Gera Token e 3. Salva Token (código original mantido)
    const verificationToken = uuidv4();
    const expires = new Date(new Date().getTime() + 3600 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: expires,
      },
    });
    
    // 4. Envia Email
    await sendVerificationEmail(email, user.name || user.username, verificationToken);

    return NextResponse.json({ message: "Utilizador registado. Por favor, verifique o seu email." }, { status: 201 });

  } catch (error) {
    console.error("[REGISTER_POST]", error);
    if (error instanceof Error && error.message.includes("Falha ao enviar")) {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new NextResponse(JSON.stringify({ error: "Erro Interno" }), { status: 500 });
  }
}