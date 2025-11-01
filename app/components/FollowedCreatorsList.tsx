// app/components/FollowedCreatorsList.tsx (Corrigido)

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// --- [REMOVIDO] Imports do Accordion e Separator ---
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/components/ui/accordion";
// import { Separator } from "@/components/ui/separator";
// --- [FIM DA REMOÇÃO] ---
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// O tipo de dado que a nossa API /api/follows retorna
type FollowedCreator = {
  username: string;
  name: string | null;
  image: string | null;
};

export default function FollowedCreatorsList() {
  const [creators, setCreators] = useState<FollowedCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Busca os dados da API (lógica igual)
  useEffect(() => {
    const fetchFollows = async () => {
      try {
        const res = await fetch('/api/follows');
        if (!res.ok) {
          throw new Error("Falha ao buscar lista de quem segue");
        }
        const data = await res.json();
        setCreators(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFollows();
  }, []); // [] = Executa apenas uma vez

  // --- [MUDANÇA AQUI] ---
  // A lógica de renderização foi simplificada para remover o Accordion

  // 1. Estado de Carregamento
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">A carregar criadores que segue...</p>;
  }

  // 2. Estado Vazio
  if (creators.length === 0) {
    return <p className="text-muted-foreground text-sm">Você ainda não segue nenhum criador.</p>;
  }

  // 3. Estado com Conteúdo (Renderiza a lista diretamente)
  return (
    <ul className="space-y-3">
      {creators.map((creator) => (
        <li key={creator.username}>
          <Link 
            href={`/${creator.username}`} 
            // Usamos accent/50 para um hover mais subtil dentro do Sheet
            className="flex items-center gap-3 p-2 rounded hover:bg-accent/50 transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={creator.image ?? undefined} alt={creator.name || creator.username} />
              <AvatarFallback>{(creator.name || creator.username).substring(0, 1)}</AvatarFallback>
            </Avatar>
            <div>
              <span className="font-medium text-foreground">{creator.name || creator.username}</span>
              {creator.name && <span className="text-sm text-muted-foreground ml-1">(@{creator.username})</span>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
  // --- [FIM DA MUDANÇA] ---
}