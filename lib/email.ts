// lib/email.ts

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
// Garante que o link de verificação use a URL correta
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'; 

// --- Função para o Email de Verificação ---

function createVerificationEmailHtml(username: string, verificationLink: string): string {
  const containerStyle = "font-family: Arial, sans-serif; line-height: 1.6; background-color: #f9f9f9; padding: 30px; border-radius: 8px;";
  const headingStyle = "font-size: 24px; color: #222;";
  const pStyle = "font-size: 16px; color: #555; margin-bottom: 20px;";
  const btnStyle = "display: inline-block; background-color: #6366F1; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 5px; font-size: 16px; font-weight: bold;";
  const footerStyle = "font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;";

  return `
    <div style="${containerStyle}">
      <h1 style="${headingStyle}">Bem-vindo, ${username}!</h1>
      <p style="${pStyle}">
        Obrigado por se registrar no MeuCronograma. Por favor, clique no botão abaixo para verificar seu email e ativar sua conta:
      </p>
      <a href="${verificationLink}" style="${btnStyle}">
        Verificar meu Email
      </a>
      <p style="${pStyle}">
        Este link de verificação expirará em 1 hora.
      </p>
      <p style="${footerStyle}">
        © ${new Date().getFullYear()} MeuCronograma. Todos os direitos reservados.
      </p>
    </div>
  `;
}

export async function sendVerificationEmail(email: string, username: string, token: string) {
  const verificationLink = `${baseUrl}/api/auth/verify?token=${token}`;
  
  const emailHtml = createVerificationEmailHtml(username, verificationLink);

  try {
    const { data, error } = await resend.emails.send({
      // --- [MUDANÇA CRÍTICA AQUI] ---
      // Use o seu domínio verificado
      from: 'MeuCronograma <nao-responda@meucronograma.live>', // <-- Use o seu domínio verificado
      // --- [FIM DA MUDANÇA] ---
      to: [email],
      subject: 'Confirme seu email - MeuCronograma',
      html: emailHtml,
    });

    if (error) {
      console.error("Erro ao enviar email de verificação:", error);
      throw new Error("Falha ao enviar email de verificação.");
    }
    
    console.log("Email de verificação enviado:", data?.id);
    return data;

  } catch (error) {
    throw error;
  }
}