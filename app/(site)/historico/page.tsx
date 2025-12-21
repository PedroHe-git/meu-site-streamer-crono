import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { UserRole, MovieStatusType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { ExternalLink, Youtube, History, PlayCircle } from 'lucide-react';
import UserListsClient from '@/app/components/UserListsClient';
import Link from 'next/link';

export const revalidate = 60; // Revalida a cada 1 minuto

export const metadata: Metadata = {
  title: 'VODS | Itens Assistidos',
  description: 'Arquivo de lives passadas e lista de jogos e séries completados.',
};

async function getCreatorData() {
  // 1. Busca o usuário Criador (Dono do site)
  const creator = await prisma.user.findFirst({
    where: { role: UserRole.CREATOR },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      // Se você tiver um campo específico para canal de VODs no futuro, adicione aqui.
      // Por enquanto vamos usar um link fixo ou o youtube principal.
    }
  });

  if (!creator) return null;

  // 2. Busca a contagem de itens para as listas
  const counts = await prisma.mediaStatus.groupBy({
    by: ['status'],
    where: { userId: creator.id },
    _count: { status: true },
  });

  // Formata os counts para o formato que o componente espera
  const listCounts = {
    TO_WATCH: 0,
    WATCHING: 0,
    WATCHED: 0,
    DROPPED: 0,
  };

  counts.forEach((c) => {
    if (c.status in listCounts) {
      listCounts[c.status as keyof typeof listCounts] = c._count.status;
    }
  });

  return { creator, listCounts };
}

export default async function HistoricoPage() {
  const data = await getCreatorData();

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <p>Perfil do criador não encontrado.</p>
      </div>
    );
  }

  const { creator, listCounts } = data;

  // LINK DO CANAL DE VODS (Substitua pelo seu link real)
  const VOD_CHANNEL_URL = "https://cinefy.gg/mahmoojen"; 

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
      
      {/* --- CABEÇALHO --- */}
      <header className="bg-gradient-to-b from-gray-900 to-gray-950 py-16 border-b border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600/10 rounded-full mb-4">
            <History className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-white">
            Arquivo & Histórico
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Perdeu a live? Confira os VODs gravados ou veja a lista de tudo que já vimos em lives.
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-6xl -mt-8">
        
        {/* --- SEÇÃO 1: ACESSO AOS VODS (DESTAQUE) --- */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 md:p-12 shadow-2xl relative overflow-hidden mb-16 group">
          {/* Efeito de fundo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-all group-hover:bg-red-600/20" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                <Youtube className="text-red-600 w-8 h-8" />
                Canal de VODs
              </h2>
              <p className="text-gray-400 max-w-md">
                Todas as transmissões passadas são salvas na íntegra no nosso canal do Cinefy. Assista quando quiser.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                asChild 
                size="lg" 
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 h-14 text-lg shadow-lg shadow-red-900/20"
              >
                <a href={VOD_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                  <PlayCircle className="mr-2 w-5 h-5" />
                  Acessar Cinefy
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* --- SEÇÃO 2: LISTA DE ZERADOS/ASSISTIDOS --- */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-gray-800 flex-1" />
            <h3 className="text-2xl font-bold text-gray-300">Histórico de Mídia</h3>
            <div className="h-px bg-gray-800 flex-1" />
          </div>

          {/* Reutilizamos o UserListsClient, mas "enganamos" ele para focar no Histórico.
            Passamos false para as outras listas para que o usuário veja apenas o que importa aqui.
          */}
          <UserListsClient
            username={creator.username}
            isOwner={false} // Modo visualização (não mostra botões de editar)
            counts={listCounts}
            // 👇 TRUQUE: Só ativamos a lista de WATCHED (Vistos)
            showWatchedList={true} 
            showToWatchList={false} 
            showWatchingList={false}
            showDroppedList={false}
          />
          
          <div className="text-center mt-8">
             <Button variant="link" asChild className="text-gray-500">
                <Link href={`/${creator.username}`}>
                  Ver perfil completo e outras listas <ExternalLink className="ml-1 w-3 h-3" />
                </Link>
             </Button>
          </div>

        </div>

      </div>
    </div>
  );
}