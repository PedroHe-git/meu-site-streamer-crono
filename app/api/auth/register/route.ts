    import { NextResponse } from "next/server";
    import prisma from "@/lib/prisma";
    import bcrypt from "bcrypt";
    // Não precisa importar UserRole aqui

    export async function POST(request: Request) {
      try {
        const body = await request.json();
        const { name, username, email, password, role } = body; // Recebe 'role' como string

        // Validação básica
        if (!name || !username || !email || !password || !role) { return new NextResponse(JSON.stringify({ error: "Todos os campos são obrigatórios" }), { status: 400 }); }
        // Valida usando strings
        if (role !== "CREATOR" && role !== "VISITOR") { return new NextResponse(JSON.stringify({ error: "Função (role) inválida" }), { status: 400 }); }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {  return new NextResponse(JSON.stringify({ error: "Username inválido (letras, números, _)." }), { status: 400 }); }

        // Verifica se já existe
        const existingUserByEmail = await prisma.user.findUnique({ where: { email } }); if (existingUserByEmail) { return new NextResponse(JSON.stringify({ error: "Email já registado" }), { status: 409 }); }
        const existingUserByUsername = await prisma.user.findUnique({ where: { username } }); if (existingUserByUsername) { return new NextResponse(JSON.stringify({ error: "Username já em uso" }), { status: 409 }); }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Cria o utilizador (passa a string 'role')
        const newUser = await prisma.user.create({
          data: {
            name,
            username,
            email,
            hashedPassword,
            role: role, // Prisma mapeia a string para o enum
          },
        });

        // Exclui a senha hashada da resposta
        const { hashedPassword: _, ...userWithoutPassword } = newUser;
        return NextResponse.json(userWithoutPassword, { status: 201 });

      } catch (error) {
        console.error("Erro no registo:", error);
        // Tratamento de erro específico se o Prisma não reconhecer a string da role
        if (error instanceof Error && error.message.includes("Argument `role` is invalid")) {
             return new NextResponse(JSON.stringify({ error: "Erro interno: A função (role) fornecida não é válida no schema do banco de dados." }), { status: 500 });
        }
        // Tratamento de erro mais genérico do Prisma (pode ser útil)
        if (error instanceof Error && 'code' in error && error.code === 'P2002') { // Prisma unique constraint error
            return new NextResponse(JSON.stringify({ error: "Erro: Dados duplicados (email ou username já existem)." }), { status: 409 });
        }
        // Erro genérico
        return new NextResponse(JSON.stringify({ error: "Erro interno do servidor durante o registo." }), { status: 500 });
      }
    }
    

