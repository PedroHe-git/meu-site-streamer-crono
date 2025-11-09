"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PaginatedList from "./PaginatedList"; 
import { Lock, Search } from "lucide-react"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; 
import { Input } from "@/components/ui/input"; 
import { Badge } from "@/components/ui/badge"; // <-- [NOVO] Importar Badge

type ListCounts = {
  TO_WATCH: number;
  WATCHING: number;
  WATCHED: number;
  DROPPED: number;
};

type UserListsClientProps = {
  username: string;
  showToWatchList: boolean;
  showWatchingList: boolean;
  showWatchedList: boolean;
  showDroppedList: boolean;
  isOwner: boolean; 
  counts: ListCounts; // <-- [NOVO] Aceita o prop de contagens
};

// Componente para a mensagem de privacidade
const PrivacyMessage = () => (
  <div className="flex flex-col items-center justify-center text-center p-12 bg-muted/50 rounded-lg">
    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-xl font-semibold">Lista Privada</h3>
    <p className="text-muted-foreground">O dono deste perfil tornou esta lista privada.</p>
  </div>
);

export default function UserListsClient({
  username,
  showToWatchList,
  showWatchingList,
  showWatchedList,
  showDroppedList,
  isOwner, 
  counts, // <-- [NOVO] Recebe as contagens
}: UserListsClientProps) {
  
  const [searchTerm, setSearchTerm] = useState("");

  const canViewToWatch = isOwner || showToWatchList;
  const canViewWatching = isOwner || showWatchingList;
  const canViewWatched = isOwner || showWatchedList;
  const canViewDropped = isOwner || showDroppedList;

  const defaultOpenLists: string[] = [];
  if (canViewToWatch) defaultOpenLists.push("to-watch");
  if (canViewWatching) defaultOpenLists.push("watching");
  
  const anyListVisible = canViewToWatch || canViewWatching || canViewWatched || canViewDropped;

  return (
    <div className="space-y-6">
      
      {/* Barra de Pesquisa (Mantida) */}
      <Card className="shadow-lg border-2">
        <CardHeader>
          <CardTitle>Listas de {username}</CardTitle>
          <CardDescription>
            Veja o que este criador está a acompanhar.
          </CardDescription>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar nas listas do criador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      {/* --- [INÍCIO DA CORREÇÃO DO LAYOUT] --- */}
      {/* Trocamos o div/Tabs por um Accordion */}
      {anyListVisible ? (
        <Accordion
          type="multiple" 
          defaultValue={defaultOpenLists} 
          className="space-y-6"
        >
          
          {canViewToWatch && (
            <AccordionItem value="to-watch" className="border-2 shadow-lg rounded-lg bg-card">
              <AccordionTrigger className="p-6 text-lg font-semibold">
                {/* [NOVO] Adiciona o div e o Badge */}
                <div className="flex items-center gap-2">
                  <span>Próximo Conteúdo</span>
                  <Badge className="bg-purple-600">{counts.TO_WATCH}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-6 pt-0">
                <PaginatedList key="to-watch" username={username} status="TO_WATCH" searchTerm={searchTerm} />
              </AccordionContent>
            </AccordionItem>
          )}

          {canViewWatching && (
            <AccordionItem value="watching" className="border-2 shadow-lg rounded-lg bg-card">
              <AccordionTrigger className="p-6 text-lg font-semibold">
                {/* [NOVO] Adiciona o div e o Badge */}
                <div className="flex items-center gap-2">
                  <span>Essa Semana</span>
                  <Badge className="bg-blue-600">{counts.WATCHING}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-6 pt-0">
                <PaginatedList key="watching" username={username} status="WATCHING" searchTerm={searchTerm} />
              </AccordionContent>
            </AccordionItem>
          )}

          {canViewWatched && (
            <AccordionItem value="watched" className="border-2 shadow-lg rounded-lg bg-card">
              <AccordionTrigger className="p-6 text-lg font-semibold">
                {/* [NOVO] Adiciona o div e o Badge */}
                <div className="flex items-center gap-2">
                  <span>Já Assistido</span>
                  <Badge className="bg-green-600">{counts.WATCHED}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-6 pt-0">
                <PaginatedList key="watched" username={username} status="WATCHED" searchTerm={searchTerm} />
              </AccordionContent>
            </AccordionItem>
          )}

          {canViewDropped && (
            <AccordionItem value="dropped" className="border-2 shadow-lg rounded-lg bg-card">
              <AccordionTrigger className="p-6 text-lg font-semibold">
                {/* [NOVO] Adiciona o div e o Badge */}
                <div className="flex items-center gap-2">
                  <span>Abandonados</span>
                  <Badge className="bg-orange-600">{counts.DROPPED}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-6 pt-0">
                <PaginatedList key="dropped" username={username} status="DROPPED" searchTerm={searchTerm} />
              </AccordionContent>
            </AccordionItem>
          )}

        </Accordion>
      ) : (
        // Mensagem de fallback se TODAS as listas forem privadas
        <div className="flex flex-col items-center justify-center text-center p-12 bg-muted/50 rounded-lg">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Listas Privadas</h3>
          <p className="text-muted-foreground">O dono deste perfil tornou todas as suas listas privadas.</p>
        </div>
      )}
      {/* --- [FIM DA CORREÇÃO DO LAYOUT] --- */}
    </div>
  );
}