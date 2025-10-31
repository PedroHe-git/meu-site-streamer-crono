// app/api/auth/request-reset/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

// --- [REMOVIDO] ---
// import { render } from '@react-email/render';
// import { ResetPasswordEmail } from "@/app/components/emails/ResetPasswordEmail";
// --- [FIM DA REMOÇÃO] ---

// Configura o runtime e a região
export const runtime = 'nodejs';


const resend = new Resend(process.env.RESEND_API_KEY);
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// --- [NOVO] Função manual de HTML ---
function createResetEmailHtml(username: string, resetLink: string): string {
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
// --- [FIM DA FUNÇÃO] ---

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new NextResponse(JSON.stringify({ error: "Email é obrigatório" }), { status: 400 });
    }

    // 1. Encontra o usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.hashedPassword) {
      // Segurança: não informa se o email existe ou se é OAuth
      console.log(`[RESET] Pedido de reset para email não-registrado ou OAuth: ${email}`);
      return NextResponse.json({ message: "Se este email estiver registado, um link de recuperação será enviado." }, { status: 200 });
    }

    // 2. Gera o token
    const token = crypto.randomUUID();
    const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hora

    // 3. Deleta tokens antigos e cria o novo
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

    // 4. Cria o link
    const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

    // 5. Gera o HTML manualmente
    const emailHtml = createResetEmailHtml(user.name || user.username, resetLink);

    // 6. Envia o email
    const { data, error } = await resend.emails.send({
      from: 'MeuCronograma <nao-responda@meucronograma.live>',
      to: [email],
      subject: 'Redefina sua senha - MeuCronograma',
      html: emailHtml,
    });

    if (error) {
      // Este erro não deve mais acontecer
      console.error("Erro ao enviar email de reset:", error);
      throw new Error("Falha ao enviar email.");
    }

    return NextResponse.json({ message: "Se este email estiver registado, um link de recuperação será enviado." }, { status: 200 });

  } catch (error) {
    console.error("Erro na API de request-reset:", error);
    return new NextResponse(JSON.stringify({ error: "Erro interno do servidor." }), { status: 500 });
  }
}