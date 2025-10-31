// app/components/emails/ResetPasswordEmail.tsx

import * as React from 'react';

interface ResetPasswordEmailProps {
  username: string;
  resetLink: string;
}

// Nota: Usamos os mesmos estilos do email de verificação
export const ResetPasswordEmail: React.FC<Readonly<ResetPasswordEmailProps>> = ({
  username,
  resetLink,
}) => (
  <div style={container}>
    <h1 style={heading}>Olá, {username}.</h1>
    <p style={paragraph}>
      Recebemos um pedido para redefinir a senha da sua conta no MeuCronograma.
      Clique no botão abaixo para definir uma nova senha:
    </p>
    <a href={resetLink} style={button}>
      Redefinir minha Senha
    </a>
    <p style={paragraph}>
      Este link de redefinição de senha expirará em 1 hora.
    </p>
    <p style={paragraph}>
      Se você não solicitou esta alteração, pode ignorar este email com segurança.
    </p>
    <p style={footer}>
      © {new Date().getFullYear()} MeuCronograma. Todos os direitos reservados.
    </p>
  </div>
);

// Estilos Inline para o Email
const container: React.CSSProperties = {
  fontFamily: 'Arial, sans-serif',
  lineHeight: '1.6',
  backgroundColor: '#f9f9f9',
  padding: '30px',
  borderRadius: '8px',
};

const heading: React.CSSProperties = {
  fontSize: '24px',
  color: '#222',
};

const paragraph: React.CSSProperties = {
  fontSize: '16px',
  color: '#555',
  marginBottom: '20px',
};

const button: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#6366F1', // Cor índigo
  color: '#ffffff',
  textDecoration: 'none',
  padding: '12px 20px',
  borderRadius: '5px',
  fontSize: '16px',
  fontWeight: 'bold',
};

const footer: React.CSSProperties = {
  fontSize: '12px',
  color: '#999',
  marginTop: '30px',
  borderTop: '1px solid #ddd',
  paddingTop: '20px',
};