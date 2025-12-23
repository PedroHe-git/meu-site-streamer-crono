import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { PlayCircle, ListVideo } from 'lucide-react';
import UserListsClient from '@/app/components/UserListsClient';
import NextImage from "next/image";
import { unstable_cache } from "next/cache"; // 👈 1. Importação do Cache

export const revalidate = 60; 

export const metadata: Metadata = {
  title: 'Histórico e Listas | MahMoojen',
  description: 'Confira o que estamos assistindo, o que já vimos e o que vem por aí.',
};

// 2. Função Otimizada com Cache (Zero Scale)
const getCachedCreatorData = unstable_cache(
  async () => {
    // Busca o criador E as configurações de visibilidade dele
    const creator = await prisma.user.findFirst({
      where: { role: UserRole.CREATOR },
      select: { 
        id: true, 
        username: true,
        // Configurações de visibilidade
        showToWatchList: true,
        showWatchingList: true,
        showWatchedList: true,
        showDroppedList: true
      }
    });

    if (!creator) return null;

    // Busca as contagens (Count)
    const counts = await prisma.mediaStatus.groupBy({
      by: ['status'],
      where: { userId: creator.id },
      _count: { status: true },
    });

    // Organiza as contagens
    const listCounts = { TO_WATCH: 0, WATCHING: 0, WATCHED: 0, DROPPED: 0 };
    counts.forEach((c) => {
      if (c.status in listCounts) listCounts[c.status as keyof typeof listCounts] = c._count.status;
    });

    return { creator, listCounts };
  },
  ['history-page-data'], // Chave única do cache
  {
    revalidate: 3600, // 👈 Atualiza a cada 1 hora (Economiza muito banco)
    tags: ['history-stats', 'user-profile'] // Tags para invalidar se necessário
  }
);

export default async function HistoricoPage() {
  // 3. Usa a função cacheada
  const data = await getCachedCreatorData();

  if (!data) return <div className="min-h-screen flex items-center justify-center">Perfil não encontrado.</div>;

  const { creator, listCounts } = data;
  const VOD_CHANNEL_URL = "https://cinefy.gg/mahmoojen"; 

  // Calcula o total de itens
  const totalItems = listCounts.TO_WATCH + listCounts.WATCHING + listCounts.WATCHED + listCounts.DROPPED;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
      
      <header className="py-20 border-b border-gray-900 bg-gradient-to-b from-gray-900/50 to-gray-950">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-black text-white mb-2">Conteúdos & VODs</h1>
          <p className="text-gray-400">Tudo o que assistimos, estamos vendo e vamos ver em live.</p>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-6xl mt-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* --- BLOCO ESQUERDA: LISTAS --- */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                 <ListVideo className="w-5 h-5 text-purple-500" />
                 Biblioteca do Canal
              </h2>
              <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full font-mono">
                  {totalItems} Itens
              </span>
            </div>

            {/* 👇 CONFIGURAÇÃO DAS LISTAS */}
            <UserListsClient
              username={creator.username}
              isOwner={false}
              counts={listCounts}
              // Se vier null do banco, usamos 'true' por padrão
              showToWatchList={creator.showToWatchList ?? true} 
              showWatchingList={creator.showWatchingList ?? true}
              showWatchedList={creator.showWatchedList ?? true} 
              showDroppedList={creator.showDroppedList ?? true}
              isCompact={true}
              itemsPerPage={10} 
            />
          </div>

          {/* --- BLOCO DIREITA: CINEFY --- */}
          <div className="bg-gradient-to-br from-yellow-950/40 to-gray-900/40 border border-yellow-500/20 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center h-full min-h-[500px] relative overflow-hidden group">
             
             <div className="absolute inset-0 bg-yellow-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

             <div className="relative z-10 flex flex-col items-center">
                
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-3xl shadow-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-yellow-500/30 p-4">
                    <NextImage 
                       src="/logocinefy.png" 
                       alt="Logo Cinefy" 
                       width={80} 
                       height={80} 
                       className="object-contain drop-shadow-md"
                    />
                </div>

                <h2 className="text-3xl font-black text-white mb-4">
                  Perdeu a Live?
                </h2>
                
                <p className="text-gray-400 max-w-sm mb-8 leading-relaxed">
                  Não se preocupe! Todas as transmissões são gravadas na íntegra e salvas no canal do <strong>Cinefy</strong>.
                </p>

                <Button 
                  asChild 
                  size="lg"
                  className="bg-white text-yellow-600 hover:bg-gray-100 hover:text-yellow-700 font-bold px-8 h-12 shadow-lg hover:shadow-yellow-900/20 transition-all"
                >
                  <a href={VOD_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                    <PlayCircle className="mr-2 w-5 h-5" />
                    Acessar Canal Cinefy
                  </a>
                </Button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}