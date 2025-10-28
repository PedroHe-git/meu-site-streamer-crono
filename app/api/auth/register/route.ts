import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

// --- [CORREÇÃO AQUI] ---
// A função DEVE ser exportada com o nome do método HTTP (POST)
export async function POST(request: Request) {
// --- [FIM DA CORREÇÃO] ---

  try {
    const body = await request.json();
    const { name, username, email, password } = body;

    // Validação básica (poderia ser mais robusta com zod)
    if (!name || !username || !email || !password) {
      return new NextResponse(JSON.stringify({ error: "Todos os campos são obrigatórios" }), { status: 400 });
    }
     // Validação simples de username
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
       return new NextResponse(JSON.stringify({ error: "Username pode conter apenas letras, números e underscores (_)." }), { status: 400 });
    }

    // Verificar se o email ou username já existem
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingUserByEmail) {
      return new NextResponse(JSON.stringify({ error: "Email já registado" }), { status: 409 }); // 409 Conflict
    }
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: username },
    });
     if (existingUserByUsername) {
      return new NextResponse(JSON.stringify({ error: "Username já em uso" }), { status: 409 }); // 409 Conflict
    }


    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria o utilizador
    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        email,
        hashedPassword,
      },
    });

    // Retorna o novo utilizador (sem a senha)
    const { hashedPassword: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 }); // 201 Created

  } catch (error) {
    console.error("Erro no registo:", error);
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor" }), { status: 500 });
  }
}

// NOTA: Não exporte mais nada deste ficheiro (ex: default export)

