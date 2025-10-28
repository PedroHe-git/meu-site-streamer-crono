import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

// Função exportada como POST para lidar com pedidos de registo
export async function POST(request: Request) {
  try {
    // Lê os dados enviados no corpo do pedido (JSON)
    const body = await request.json();
    const { name, username, email, password } = body;

    // Validação básica dos campos obrigatórios
    if (!name || !username || !email || !password) {
      return new NextResponse(JSON.stringify({ error: "Todos os campos são obrigatórios" }), { status: 400 });
    }
    // Validação simples do formato do username (apenas letras, números e underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
       return new NextResponse(JSON.stringify({ error: "Username inválido (letras, números, _)." }), { status: 400 });
    }

    // Verifica se já existe um utilizador com o mesmo email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingUserByEmail) {
      // Retorna erro 409 Conflict se o email já estiver em uso
      return new NextResponse(JSON.stringify({ error: "Email já registado" }), { status: 409 });
    }
    // Verifica se já existe um utilizador com o mesmo username
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: username },
    });
     if (existingUserByUsername) {
      // Retorna erro 409 Conflict se o username já estiver em uso
      return new NextResponse(JSON.stringify({ error: "Username já em uso" }), { status: 409 });
    }

    // Cria um hash seguro da senha antes de a guardar
    // O '10' é o "custo" do hashing (número de rondas)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria o novo utilizador na base de dados usando o Prisma Client
    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        email,
        hashedPassword, // Guarda a senha hashada
      },
    });

    // Remove a senha hashada do objeto antes de o retornar na resposta
    // (Boa prática de segurança)
    const { hashedPassword: _, ...userWithoutPassword } = newUser;
    // Retorna os dados do novo utilizador com status 201 Created
    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    // Captura quaisquer outros erros (ex: problema de conexão com BD)
    console.error("Erro no registo:", error);
    // Retorna um erro genérico 500 Internal Server Error
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor" }), { status: 500 });
  }
}

// Garante que apenas a função POST é exportada neste ficheiro de rota

