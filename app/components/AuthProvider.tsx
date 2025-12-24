"use client";

import { SessionProvider } from "next-auth/react";

type Props = {
  children: React.ReactNode;
};

export default function AuthProvider({ children }: Props) {
  return (
    <SessionProvider 
      // Desativa o refetch ao focar na janela (ótimo para economia)
      refetchOnWindowFocus={false} 
      
      // REMOVA ou coloque 0 para desativar o polling automático.
      // O token já tem validade longa (30 dias). Não há necessidade de verificar a cada 5 min.
      refetchInterval={0} 
    >
      {children}
    </SessionProvider>
  );
}