import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import Navbar from "./components/Navbar"; // <-- [MUDANÇA AQUI] Importa 'Navbar'

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
    <html lang="pt-br">
      <body className={`${inter.className} bg-slate-100`}>
        <AuthProvider>
          <Navbar /> {/* <-- [MUDANÇA AQUI] Usa o <Navbar /> */}
          <main>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}

