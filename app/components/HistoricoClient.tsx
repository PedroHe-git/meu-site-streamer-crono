"use client";

import { useState } from "react";
import { Search, ListVideo, PlayCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import UserListsClient from "@/app/components/UserListsClient";
import { Button } from "@/components/ui/button";
import NextImage from "next/image";

interface HistoricoClientProps {
  creator: {
    username: string;
    showWatchingList: boolean | null;
    showToWatchList: boolean | null;
    showWatchedList: boolean | null;
    showDroppedList: boolean | null;
  };
  counts: {
    WATCHING: number;
    TO_WATCH: number;
    WATCHED: number;
    DROPPED: number;
  };
  isOwner: boolean;
}

export default function HistoricoClient({ creator, counts, isOwner }: HistoricoClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const totalItems = counts.TO_WATCH + counts.WATCHING + counts.WATCHED + counts.DROPPED;
  const VOD_CHANNEL_URL = "https://cinefy.gg/mahmoojen"; 

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
      
      {/* HEADER */}
      <header className="py-20 border-b border-gray-900 bg-gradient-to-b from-gray-900/50 to-gray-950">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-black text-white mb-2">Conteúdos & VODs</h1>
          <p className="text-gray-400">O que {creator.username} assistiu, está vendo e vai ver.</p>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-6xl mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* --- BLOCO ESQUERDA: LISTAS --- */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 md:p-8">

            {/* Título e Pesquisa */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <ListVideo className="w-5 h-5 text-purple-500" />
                  Biblioteca
                </h2>
                <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full font-mono">
                  {totalItems} Itens
                </span>
              </div>

              {/* BARRA DE PESQUISA */}
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <Input
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 bg-black/20 border-gray-700 text-sm focus:border-purple-500"
                />
              </div>
            </div>

            {/* LISTAS OTIMIZADAS PARA O ESPAÇO */}
            <UserListsClient
              username={creator.username}
              isOwner={isOwner}
              counts={counts}
              searchTerm={searchTerm}
              
              // 👇 AJUSTES PARA VISUAL MAIOR E LIMPO
              itemsPerPage={6} // Menos itens por página
              gridClassName="grid-cols-2 sm:grid-cols-3" // Grade com menos colunas = Itens Maiores
              
              privacySettings={{
                showWatching: creator.showWatchingList ?? true,
                showToWatch: creator.showToWatchList ?? true,
                showWatched: creator.showWatchedList ?? true,
                showDropped: creator.showDroppedList ?? true
              }}
            />
          </div>

          {/* --- BLOCO DIREITA: CINEFY --- */}
          <div className="bg-gradient-to-br from-yellow-950/40 to-gray-900/40 border border-yellow-500/20 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center h-full min-h-[500px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-yellow-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-3xl shadow-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-yellow-500/30 p-4">
                <NextImage src="/logocinefy.png" alt="Logo Cinefy" width={80} height={80} className="object-contain drop-shadow-md" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4">Perdeu a Live?</h2>
              <p className="text-gray-400 max-w-sm mb-8 leading-relaxed">
                Não se preocupe! Todas as transmissões são gravadas na íntegra e salvas no canal do <strong>Cinefy</strong>.
              </p>
              <Button asChild size="lg" className="bg-white text-yellow-600 hover:bg-gray-100 font-bold px-8 h-12 shadow-lg transition-all">
                <a href={VOD_CHANNEL_URL} target="_blank"><PlayCircle className="mr-2 w-5 h-5" />Acessar Canal Cinefy</a>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}