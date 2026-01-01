import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// --- BUSCAR PATROCINADORES (Cacheado) ---
export const getSponsors = async (isActive: boolean = true) => {
  const fetchFn = unstable_cache(
    async () => {
      return await prisma.sponsor.findMany({
        where: { isActive }, // 👈 Filtra pelo status
        orderBy: { createdAt: 'desc' }
      });
    },
    ['sponsors-list', isActive ? 'active' : 'inactive'], // 👈 Chave de cache diferente para cada lista
    { 
      revalidate: 3600, 
      tags: ['sponsors'] 
    } 
  );

  return fetchFn();
};

// --- BUSCAR REDES SOCIAIS (Cacheado) ---
export const getSocialItems = unstable_cache(
  async (platform?: "YOUTUBE" | "INSTAGRAM") => {
    return await prisma.socialItem.findMany({
      where: { 
        platform: platform ? platform : undefined 
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    });
  },
  ['social-items'], 
  { 
    revalidate: 3600, 
    tags: ['social'] 
  }
);