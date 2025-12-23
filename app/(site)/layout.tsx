import { Inter } from 'next/font/google';
import { Analytics } from "@vercel/analytics/react";
import Clarity from "@/app/components/Clarity";

import '@/app/globals.css'; 

import Header from '@/app/components/portfolio/Header'; 
import AuthContext from '@/app/context/AuthContext';
import AutoLogout from '@/app/components/AutoLogout';
// 👇 Importamos o Provider de Hibernação aqui
import { HibernationProvider } from "@/app/context/HibernationContext"; 

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
        {/* 1. Contexto de Autenticação (Com economia de Banco ativa) */}
        <AuthContext>
          
          {/* 2. Contexto de Hibernação (Controle Global) */}
          <HibernationProvider>
            
            {/* Componente que vigia a inatividade */}
            <AutoLogout />

            <Header />
            
            <main className="min-h-screen relative">
              {children}
              <Analytics />
              <Clarity />
            </main>

          </HibernationProvider>
          
        </AuthContext>
      </body>
    </html>
  );
}