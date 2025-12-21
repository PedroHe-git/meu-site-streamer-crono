import  Header  from "@/app/components/portfolio/Header";
import { Footer } from "@/app/components/portfolio/Footer";
import  AboutSection  from "@/app/components/portfolio/AboutSection";
import BrandLogos from "@/app/components/portfolio/BrandLogos"; // Se ainda usar
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const revalidate = 3600; // Atualiza a cada 1 hora

async function getCreatorProfile() {
  const creator = await prisma.user.findFirst({
    where: { role: UserRole.CREATOR },
    select: {
      name: true,
      username: true,
      image: true,
      bio: true,
      twitchUsername: true,
      // Adicione outros campos se tiver (instagram, twitter, etc no banco)
    }
  });
  return creator;
}

export default async function SobrePage() {
  const creator = await getCreatorProfile();

  return (
    <main className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      <Header />
      <div className="pt-24 flex-grow">
        {creator ? (
          <AboutSection user={creator} />
        ) : (
          <div className="text-center py-20 text-gray-500">
            Perfil do criador não encontrado.
          </div>
        )}
        
        {/* Se quiser manter os logos de parceiros/marcas */}
        <BrandLogos />
      </div>
      <Footer />
    </main>
  );
}