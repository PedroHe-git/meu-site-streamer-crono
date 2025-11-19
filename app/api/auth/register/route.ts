// app/api/auth/register/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";
import { headers } from "next/headers"; // [NOVO] Para pegar o IP

// --- [NOVO] Configuração do Rate Limit ---
// Armazena os IPs e as tentativas em memória
const rateLimitMap = new Map<string, { count: number; expires: number }>();

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 Hora
const MAX_REQUESTS_PER_IP = 3; // Máximo de 3 contas criadas por IP por hora

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Se não existe registo ou já expirou, cria novo/reseta
  if (!record || now > record.expires) {
    rateLimitMap.set(ip, { count: 1, expires: now + RATE_LIMIT_WINDOW });
    return true;
  }

  // Se excedeu o limite
  if (record.count >= MAX_REQUESTS_PER_IP) {
    return false;
  }

  // Incrementa contagem
  record.count++;
  return true;
}
// ---------------------------------------

const registerSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  email: z.string().email("Formato de email inválido."),
  username: z.string()
    .min(3, "O utilizador deve ter no mínimo 3 caracteres.")
    .regex(/^[a-z0-9_]+$/, "O utilizador deve conter apenas letras minúsculas, números ou underline."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
});

export async function POST(request: Request) {
  try {
    // --- [NOVO] 1. Verificação de Rate Limit ---
    const headersList = headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    
    if (!checkRateLimit(ip)) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Muitas tentativas de registo. Tente novamente mais tarde." 
        }), 
        { status: 429 } // 429 Too Many Requests
      );
    }

    const body = await request.json();
    
    // 2. Validação Zod
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const formattedErrors = validation.error.format();
      const errorMessage = formattedErrors.email?._errors[0] 
                        || formattedErrors.username?._errors[0]
                        || formattedErrors.password?._errors[0]
                        || "Dados inválidos";
                        
      return new NextResponse(
        JSON.stringify({ error: errorMessage }), 
        { status: 400 }
      );
    }

    const { name, email, username, password } = validation.data;
    const lowerCaseUsername = username.toLowerCase();

    // 3. Verificações de Duplicidade
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

    // 4. Criação do Usuário
    const hashedPassword = await bcrypt.hash(password, 12);

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

    // 5. Geração do Token
    const verificationToken = uuidv4();
    const expires = new Date(new Date().getTime() + 3600 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: expires,
      },
    });
    
    // 6. Envio de Email
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