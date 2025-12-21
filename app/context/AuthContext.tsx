// app/context/AuthContext.tsx
'use client'; // ⚠️ Muito importante: define que este arquivo roda no navegador

import { SessionProvider } from "next-auth/react";

export default function AuthContext({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}