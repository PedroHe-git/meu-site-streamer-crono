import AboutSection from "@/app/components/portfolio/AboutSection";
import BrandLogos from "@/app/components/portfolio/BrandLogos";
import prisma from "@/lib/prisma"; // 👈 Corrigido: Importação default (sem chaves)
import { UserRole } from "@prisma/client";
import { Metadata } from "next";
import PastPartners from "@/app/components/portfolio/PastPartners";

export const metadata: Metadata = {
  title: "Sobre Mim",
  description: "Conheça minha trajetória.",
};

// Revalidação a cada 1 hora (mas o revalidatePath da API de settings fura isso quando você edita)
export const revalidate = 3600; 

export default async function SobrePage() {
  // Busca o usuário "Dono" (CREATOR)
  const user = await prisma.user.findFirst({
    where: { role: UserRole.CREATOR }, // Usando o Enum do Prisma para segurança
  });

  if (!user) {
    return (
        <div className="flex items-center justify-center min-h-[60vh] bg-gray-950 text-white">
            <p className="text-muted-foreground">Perfil não configurado.</p>
        </div>
    );
  }

  return (
    <main className="min-h-screen pt-20 bg-gray-950">
      <AboutSection user={user} />
      <BrandLogos/>
      <PastPartners/>
    </main>
  );
}