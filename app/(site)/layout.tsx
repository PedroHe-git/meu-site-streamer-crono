// app/(site)/layout.tsx
import { Inter } from 'next/font/google';

import '@/app/globals.css'; 
// 👇 MUDANÇA: Usamos o Header do Portfolio como a navegação principal
import Header from '@/app/components/portfolio/Header'; 
import AuthContext from '@/app/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'PedroHE | Streamer & Content Creator',
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
          
          {/* Navegação Unificada */}
          <Header />
          
          {/* Conteúdo Principal */}
          {/* 'min-h-screen' garante que o rodapé fique lá embaixo */}
          <main className="min-h-screen relative">
            {children}
          </main>
          
        </AuthContext>
      </body>
    </html>
  );
}