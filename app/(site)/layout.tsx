// app/(site)/layout.tsx
import { Inter } from 'next/font/google';

// 👇 CORREÇÃO: Usando caminhos absolutos baseados no seu tsconfig.json
import '@/app/globals.css'; 
import Navbar from '@/app/components/Navbar';
import AuthContext from '@/app/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Meu Site Streamer',
  description: 'Painel e Overlay para Streamers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthContext>
          {/* A Navbar fica fixa no topo */}
          <Navbar />
          
          {/* O conteúdo da página (dashboard, login, etc) é renderizado aqui */}
          <main className="min-h-screen bg-gray-100">
            {children}
          </main>
        </AuthContext>
      </body>
    </html>
  );
}