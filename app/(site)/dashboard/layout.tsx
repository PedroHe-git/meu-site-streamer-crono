import { ReactNode } from "react";
import Navbar from "@/app/components/Navbar"; // Sua Navbar original
import AutoLogout from "@/app/components/AutoLogout"; // 👈 Componente Novo
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 1. Verifica no servidor se tem usuário logado
  const session = await getServerSession(authOptions);

  // 2. Se não tiver logado, manda pro login
  if (!session) {
    redirect("/auth/signin");
  }

  // 3. (Opcional) Segurança extra: Só CREATOR entra no dashboard
  if (session.user.role !== UserRole.CREATOR) {
     redirect("/");
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* O AutoLogout fica vigiando a inatividade aqui */}
      <AutoLogout /> 

      {/* Sua Navbar do sistema */}
      <Navbar /> 
      
      <main className="flex-1 container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  );
}