"use client";

import { SessionProvider } from "next-auth/react";

export default function AuthContext({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <SessionProvider
      // 👇 Bloqueia verificações automáticas que acordam o banco
      refetchInterval={0}           // Desativa polling (verificação por tempo)
      refetchOnWindowFocus={false}  // 🛑 Desativa verificação ao trocar de aba (IMPORTANTE)
      refetchWhenOffline={false}    // Desativa tentativas sem internet
    >
      {children}
    </SessionProvider>
  );
}