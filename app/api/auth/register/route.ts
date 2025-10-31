import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Resend } from "resend";
import crypto from "crypto";

export const runtime = 'nodejs';
export const region = 'gru1';

// 1. REMOVEMOS todas as importações de React, render, e o componente de Email
// import { render } from '@react-email/render';
// import { VerificationEmail } from "@/app/components/emails/VerificationEmail";

const resend = new Resend(process.env.RESEND_API_KEY);
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// 2. [NOVO] Função que cria o HTML manualmente
function createEmailHtml(username: string, verificationLink: string): string {
  // Estilos CSS inline (obrigatório para emails)
  const containerStyle = "font-family: Arial, sans-serif; line-height: 1.6; background-color: #f9f9f9; padding: 30px; border-radius: 8px;";
  const headingStyle = "font-size: 24px; color: #222;";
  const pStyle = "font-size: 16px; color: #555; margin-bottom: 20px;";
  const btnStyle = "display: inline-block; background-color: #6366F1; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 5px; font-size: 16px; font-weight: bold;";
  const footerStyle = "font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;";

  return `
    <div style="${containerStyle}">
      <h1 style="${headingStyle}">Olá, ${username}!</h1>
      <p style="${pStyle}">
        Obrigado por se registrar no MeuCronograma. Por favor, clique no botão
        abaixo para verificar seu endereço de email e ativar sua conta.
      </p>
      <a href="${verificationLink}" style="${btnStyle}">
        Verificar meu Email
      </a>
      <p style="${pStyle}">
        Se você não solicitou este registro, por favor, ignore este email.
      </p>
      <p style="${footerStyle}">
        © ${new Date().getFullYear()} MeuCronograma. Todos os direitos reservados.
      </p>
    </div>
  `;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, username, email, password, role } = body; 

    // ... (Sua lógica de validação e criação de usuário permanece IDÊNTICA)
    if (!name || !username || !email || !password || !role) { return new NextResponse(JSON.stringify({ error: "Todos os campos são obrigatórios" }), { status: 400 }); }
    if (role !== "CREATOR" && role !== "VISITOR") { return new NextResponse(JSON.stringify({ error: "Função (role) inválida" }), { status: 400 }); }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { 
      return new NextResponse(JSON.stringify({ error: "Username inválido (letras, números, _)." }), { status: 400 }); 
    }
    const existingUserByEmail = await prisma.user.findUnique({ where: { email } }); 
    if (existingUserByEmail) { return new NextResponse(JSON.stringify({ error: "Email já registado" }), { status: 409 }); }
    const existingUserByUsername = await prisma.user.findUnique({ where: { username } }); 
    if (existingUserByUsername) { return new NextResponse(JSON.stringify({ error: "Username já em uso" }), { status: 409 }); }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { name, username, email, hashedPassword, role: role },
    });
    // ... (Fim da lógica de criação de usuário)


    // Gera o token
    const verificationToken = crypto.randomUUID();
    const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hora

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires,
      },
    });

    const verificationLink = `${baseUrl}/api/auth/verify?token=${verificationToken}`;

    // 3. [MUDANÇA] Chama a nossa nova função de HTML
    const emailHtml = createEmailHtml(name, verificationLink);

    // 4. Envia o email
    const { data, error } = await resend.emails.send({
      from: 'MeuCronograma <nao-responda@meucronograma.live>',
      to: [email],
      subject: 'Verifique seu email - MeuCronograma',
      html: emailHtml, // Passa a string HTML
    });

    if (error) {
      // O erro 'html must be a string' não acontecerá mais
      console.error("Erro ao enviar email:", error);
      return new NextResponse(JSON.stringify({ error: "Usuário criado, mas falha ao enviar email de verificação." }), { status: 500 });
    }

    return NextResponse.json({ message: "Registro concluído! Por favor, verifique seu email." }, { status: 201 });

  } catch (error) {
    console.error("Erro no registo:", error);
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor durante o registo." }), { status: 500 });
  }
}