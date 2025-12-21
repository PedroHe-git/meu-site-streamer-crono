import Header from "@/app/components/portfolio/Header";
import Footer from "@/app/components/portfolio/Footer"; // 👈 Corrigido: sem chaves { }
import AboutSection from "@/app/components/portfolio/AboutSection";
import BrandLogos from "@/app/components/portfolio/BrandLogos";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const revalidate = 3600; // Cache de 1 hora

async function getCreatorProfile() {
  const creator = await prisma.user.findFirst({
    where: { role: UserRole.CREATOR },
    select: {
      name: true,
      username: true,
      image: true,
      bio: true,
      twitchUsername: true,
      // Adicione outros campos se necessário
    }
  });
  return creator;
}

export default async function SobrePage() {
  const creator = await getCreatorProfile();

  return (
    <main className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      
      {/* ⚠️ NOTA: Se o seu arquivo 'app/layout.tsx' já tiver o <Navbar /> (Header),
        você pode remover esse <Header /> abaixo para não aparecer duplicado.
      */}
      <Header />

      <div className="pt-24 flex-grow">
        {creator ? (
          <AboutSection user={creator} />
        ) : (
          <div className="text-center py-20 text-gray-500">
            Perfil do criador não encontrado.
          </div>
        )}
        
        <BrandLogos />
      </div>

      {/* Mesma coisa aqui: se o 'app/layout.tsx' já tiver Footer, 
        remova este para não duplicar. 
      */}
      <Footer />
    </main>
  );
}