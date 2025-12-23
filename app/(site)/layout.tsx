// app/(site)/layout.tsx
import { Inter } from 'next/font/google';
import { Analytics } from "@vercel/analytics/react";
import Clarity from "@/app/components/Clarity";

import '@/app/globals.css'; 

// 👇 Componentes Importados
import Header from '@/app/components/portfolio/Header'; 
import AuthContext from '@/app/context/AuthContext';
import AutoLogout from '@/app/components/AutoLogout'; // 👈 NOVO: Importamos a Hibernação

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'MahMoojen HUB',
  description: 'Acompanhe cronogramas, vídeos e novidades.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100`}>
        <AuthContext>
          
          {/* 👇 ADICIONADO: Monitor de Hibernação (Roda no site todo) */}
          <AutoLogout />

          {/* Navegação Unificada */}
          <Header />
          
          {/* Conteúdo Principal */}
          {/* 'min-h-screen' garante que o rodapé fique lá embaixo */}
          <main className="min-h-screen relative">
            {children}
            <Analytics />
            <Clarity />
          </main>
          
        </AuthContext>
      </body>
    </html>
  );
}