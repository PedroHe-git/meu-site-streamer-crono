import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma"; // Certifique-se que este é o prisma com 'lazy connection'
import HistoricoClient from "@/app/components/HistoricoClient";
import { unstable_cache } from "next/cache";

// Mantemos force-dynamic para verificar a sessão do usuário (se é o dono ou não)
export const dynamic = "force-dynamic";

// Defina aqui o seu usuário principal
const OWNER_USERNAME = "mahmoojen";

export const metadata: Metadata = {
  title: "Histórico de Conteúdo",
  description: "Veja o que estamos assistindo.",
};

// 1. CACHE INTELIGENTE
// Agora buscamos TUDO o que precisamos aqui dentro (User + Counts)
const getCachedHistoryData = unstable_cache(
  async (ownerUsername: string) => {
    // Busca usuário com as permissões de visualização
    const user = await prisma.user.findFirst({
      where: { username: { equals: ownerUsername, mode: "insensitive" } },
      select: { 
        id: true, 
        username: true, 
        email: true,
        // 👇 Precisamos incluir estes campos no cache
        showWatchingList: true,
        showToWatchList: true,
        showWatchedList: true,
        showDroppedList: true
      } 
    });

    if (!user) return null;

    // Busca os contadores
    const statusCounts = await prisma.mediaStatus.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: { status: true }
    });

    return { user, statusCounts };
  },
  ['history-page-full-data'], // Chave única
  { 
    revalidate: 3600, // 👈 O BANCO SÓ ACORDA A CADA 5 MINUTOS
    tags: ['history-stats'] 
  } 
);

export default async function HistoricoPage() {
  const session = await getServerSession(authOptions);

  // 2. BUSCA CACHEADA (Não toca no banco se estiver no cache)
  const data = await getCachedHistoryData(OWNER_USERNAME);

  if (!data?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p>Usuário principal ({OWNER_USERNAME}) não encontrado.</p>
      </div>
    );
  }

  // 3. Verifica se VOCÊ é o dono acessando (Lógica de servidor rápida, sem banco)
  const isOwner = session?.user?.email === data.user.email;

  // 4. Processa os contadores (Processamento de CPU, sem banco)
  const counts = {
    WATCHING: 0,
    TO_WATCH: 0,
    WATCHED: 0,
    DROPPED: 0
  };

  data.statusCounts.forEach((c) => {
    if (c.status in counts) {
      counts[c.status as keyof typeof counts] = c._count.status;
    }
  });

  // 5. Renderiza
  return (
    <HistoricoClient 
        creator={data.user}
        counts={counts}
        isOwner={isOwner}
    />
  );
}