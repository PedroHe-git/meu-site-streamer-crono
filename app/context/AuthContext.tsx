"use client";

import { SessionProvider } from "next-auth/react";
import { HibernationProvider } from "@/app/context/HibernationContext"; // Certifique-se de que este arquivo existe

export default function AuthContext({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <SessionProvider
      // 👇 Bloqueia verificações automáticas que acordam o banco
      refetchInterval={0}           // Desativa a atualização periódica (padrão era verificar a cada X tempo)
      refetchOnWindowFocus={false}  // Desativa a verificação ao trocar de aba (focar na janela)
      refetchWhenOffline={false}    // Não tenta reconectar agressivamente se cair a internet
    >
      <HibernationProvider>
        {children}
      </HibernationProvider>
    </SessionProvider>
  );
}