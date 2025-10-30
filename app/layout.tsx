// app/layout.tsx (Versão Corrigida)

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "@/app/components/theme-provider";
// Não importamos o ThemeToggle aqui, pois ele vai para dentro da Navbar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Meu Cronograma",
  description: "Organize seus filmes, séries e animes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      {/* 1. CORREÇÃO: Removemos 'bg-slate-100'. 
           Usamos 'bg-background' e 'text-foreground' do Shadcn 
           para que o fundo mude no modo escuro.
      */}
      <body className={`${inter.className} bg-background text-foreground`}>
        <AuthProvider>
          {/* 2. CORREÇÃO: O ThemeProvider DEVE envolver 
               os componentes que você quer que mudem de tema.
          */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* 3. A Navbar e o main ficam DENTRO do provider */}
            <Navbar /> 
            <main>
              {children} 
            </main>
          
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}