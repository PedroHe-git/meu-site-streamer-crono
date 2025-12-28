import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import HistoricoClient from "@/app/components/HistoricoClient";

// Força a página a ser dinâmica (sempre atualizada)
export const dynamic = "force-dynamic";

// Defina aqui o seu usuário principal
const OWNER_USERNAME = "mahmoojen";

export const metadata: Metadata = {
  title: "Histórico de Conteúdo",
  description: "Veja o que estamos assistindo.",
};

export default async function HistoricoPage() {
  const session = await getServerSession(authOptions);

  // 1. Busca os dados do DONO DO SITE (fixo)
  const user = await prisma.user.findFirst({
    where: { username: { equals: OWNER_USERNAME, mode: "insensitive" } },
    select: {
        id: true,
        username: true,
        email: true,
        showWatchingList: true,
        showToWatchList: true,
        showWatchedList: true,
        showDroppedList: true
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p>Usuário principal ({OWNER_USERNAME}) não encontrado.</p>
      </div>
    );
  }

  // 2. Verifica se VOCÊ é o dono acessando (para ver listas privadas)
  const isOwner = session?.user?.email === user.email;

  // 3. Busca os Contadores de Status
  const statusCounts = await prisma.mediaStatus.groupBy({
    by: ['status'],
    where: { userId: user.id },
    _count: { status: true }
  });

  const counts = {
    WATCHING: 0,
    TO_WATCH: 0,
    WATCHED: 0,
    DROPPED: 0
  };

  statusCounts.forEach((c) => {
    if (c.status in counts) {
      counts[c.status as keyof typeof counts] = c._count.status;
    }
  });

  // 4. Renderiza o Cliente
  return (
    <HistoricoClient 
        creator={user}
        counts={counts}
        isOwner={isOwner}
    />
  );
}