import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// --- BUSCAR PATROCINADORES (Cacheado) ---
export const getSponsors = unstable_cache(
  async () => {
    return await prisma.sponsor.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },
  ['sponsors-list'], // Chave única do cache
  { 
    revalidate: 3600, // (Backup) Atualiza a cada 1 hora mesmo se ninguém mexer
    tags: ['sponsors'] // Etiqueta para limparmos o cache manualmente
  } 
);

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