import "@/app/globals.css";
import { Inter } from "next/font/google";
import AuthProvider from "@/app/components/AuthProvider"; // Importando o provedor

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PedroHE | Portfólio & Cronograma",
  description: "Site oficial e portfólio do Streamer PedroHE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground`}>
        {/* O AuthProvider DEVE ficar dentro do body para envolver todo o app */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}