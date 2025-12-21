// app/layout.tsx
import '@/app/globals.css';
import { Inter } from 'next/font/google'; 
import Navbar from '@/app/components/Navbar'; 
import AuthContext from '@/app/context/AuthContext'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Meu App Next.js',
  description: 'Criado com NextAuth',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {/* Envolvemos tudo com o AuthContext */}
        <AuthContext>
          
          <Navbar /> {/* Agora a Navbar pode usar useSession() */}
          
          <main>
            {children}
          </main>
          
        </AuthContext>
      </body>
    </html>
  );
}