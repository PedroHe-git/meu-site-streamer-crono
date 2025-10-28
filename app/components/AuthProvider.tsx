"use client";

// Este é um componente cliente que envolve a aplicação
// para que o `useSession` funcione em qualquer lugar.

import { SessionProvider } from "next-auth/react";

type Props = {
  children: React.ReactNode;
};

export default function AuthProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}

