// app/api/auth/request-reset/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

function createResetEmailHtml(username: string, resetLink: string): string {
  // ... (Seus estilos CSS mantêm-se iguais)
  const containerStyle = "font-family: Arial, sans-serif; line-height: 1.6; background-color: #f9f9f9; padding: 30px; border-radius: 8px;";
  const headingStyle = "font-size: 24px; color: #222;";
  const pStyle = "font-size: 16px; color: #555; margin-bottom: 20px;";
  const btnStyle = "display: inline-block; background-color: #6366F1; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 5px; font-size: 16px; font-weight: bold;";
  const footerStyle = "font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;";

  return `
    <div style="${containerStyle}">
      <h1 style="${headingStyle}">Olá, ${username}.</h1>
      <p style="${pStyle}">
        Recebemos um pedido para redefinir a senha da sua conta no MeuCronograma.
        Clique no botão abaixo para definir uma nova senha:
      </p>
      <a href="${resetLink}" style="${btnStyle}">
        Redefinir minha Senha
      </a>
      <p style="${pStyle}">
        Este link de redefinição de senha expirará em 1 hora.
      </p>
      <p style="${pStyle}">
        Se você não solicitou esta alteração, pode ignorar este email com segurança.
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
    const { email } = body;

    if (!email) {
      return new NextResponse(JSON.stringify({ error: "Email é obrigatório" }), { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.hashedPassword) {
      // Resposta genérica para evitar enumeração de usuários
      return NextResponse.json({ message: "Se este email estiver registado, um link de recuperação será enviado." }, { status: 200 });
    }

    // [SEGURANÇA] Token Criptograficamente Forte (Hex de 32 bytes = 64 caracteres)
    const token = crypto.randomBytes(32).toString('hex'); 
    const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hora

    await prisma.passwordResetToken.deleteMany({
      where: { email: email },
    });
    
    await prisma.passwordResetToken.create({
      data: {
        email: email,
        token: token,
        expires: expires,
      },
    });

    const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

    // [SEGURANÇA] Passamos o username seguro
    const emailHtml = createResetEmailHtml(user.username, resetLink);

    const { data, error } = await resend.emails.send({
      from: 'MeuCronograma <nao-responda@meucronograma.live>',
      to: [email],
      subject: 'Redefina sua senha - MeuCronograma',
      html: emailHtml,
    });

    if (error) {
      console.error("Erro ao enviar email de reset:", error);
      throw new Error("Falha ao enviar email.");
    }

    return NextResponse.json({ message: "Se este email estiver registado, um link de recuperação será enviado." }, { status: 200 });

  } catch (error) {
    console.error("Erro na API de request-reset:", error);
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor." }), { status: 500 });
  }
}