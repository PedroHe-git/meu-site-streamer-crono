'use client'; 

import { SessionProvider } from "next-auth/react";

export default function AuthContext({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <SessionProvider
      // 👇 Bloqueia verificações automáticas que acordam o banco
      refetchInterval={0}           // Desativa a atualização por tempo decorrido
      refetchOnWindowFocus={false}    // Desativa a atualização ao trocar de aba ou foca na janela
      refetchWhenOffline={false}      // Desativa tentativas de reconexão em modo offline
    >
      {children}
    </SessionProvider>
  );
}