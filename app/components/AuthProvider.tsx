"use client";

import { SessionProvider } from "next-auth/react";

type Props = {
  children: React.ReactNode;
};

export default function AuthProvider({ children }: Props) {
  return (
    <SessionProvider 
      // Desativa o refetch automático ao focar na janela (economiza chamadas de sessão)
      refetchOnWindowFocus={false} 
      // Aumenta o intervalo de verificação de sessão (padrão é curto)
      refetchInterval={5 * 60} // 5 minutos
    >
      {children}
    </SessionProvider>
  );
}