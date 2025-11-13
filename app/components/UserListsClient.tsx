"use client";

import { useState } from "react";
// --- [INÍCIO DA MUDANÇA 1] ---
// Removemos o Accordion e importamos os Tabs
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// --- [FIM DA MUDANÇA 1] ---
import PaginatedList from "./PaginatedList";
import { Lock, Search } from "lucide-react"; // Removemos o ícone Bell
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge"; 

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
  counts: ListCounts; 
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
  counts, 
}: UserListsClientProps) {

  const [searchTerm, setSearchTerm] = useState("");

  const canViewToWatch = isOwner || showToWatchList;
  const canViewWatching = isOwner || showWatchingList;
  const canViewWatched = isOwner || showWatchedList;
  const canViewDropped = isOwner || showDroppedList;

  // --- [INÍCIO DA MUDANÇA 2] ---
  // Define a aba padrão. Dá prioridade a "Essa Semana" ou "Próximos".
  let defaultTab = "";
  if (canViewWatching) defaultTab = "watching";
  else if (canViewToWatch) defaultTab = "to-watch";
  else if (canViewWatched) defaultTab = "watched";
  else if (canViewDropped) defaultTab = "dropped";
  // --- [FIM DA MUDANÇA 2] ---

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
              placeholder="Buscar itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>


      {anyListVisible ? (
        // --- [INÍCIO DA MUDANÇA 3] ---
        // Substituímos o <Accordion> por <Tabs>
        <Tabs defaultValue={defaultTab} className="w-full">
          
          {/* 1. As "cabeçalhos" das abas */}
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto sm:h-10">
            {canViewToWatch && (
              <TabsTrigger value="to-watch" className="relative">
                <span className="hidden sm:inline">Próximos Conteúdos</span>
                <span className="sm:hidden">Ver</span>
                <Badge 
                  variant="outline"
                  className="border-purple-600 text-purple-600 ml-2"
                >
                  {counts.TO_WATCH}
                </Badge>
              </TabsTrigger>
            )}
            {canViewWatching && (
              <TabsTrigger value="watching" className="relative">
                <span className="hidden sm:inline">Essa Semana</span>
                <span className="sm:hidden">Vendo</span>
                <Badge 
                  variant="outline"
                  className="border-blue-600 text-blue-600 ml-2"
                >
                  {counts.WATCHING}
                </Badge>
              </TabsTrigger>
            )}
            {canViewWatched && (
              <TabsTrigger value="watched" className="relative">
                <span className="hidden sm:inline">Já Assistidos</span>
                <span className="sm:hidden">Vistos</span>
                <Badge 
                  variant="outline"
                  className="border-green-600 text-green-600 ml-2"
                >
                  {counts.WATCHED}
                </Badge>
              </TabsTrigger>
            )}
            {canViewDropped && (
              <TabsTrigger value="dropped" className="relative">
                Abandonados
                <Badge 
                  variant="outline"
                  className="border-orange-600 text-orange-600 ml-2"
                >
                  {counts.DROPPED}
                </Badge>
              </TabsTrigger>
            )}
          </TabsList>
          
          {/* 2. O conteúdo das abas (dentro de um Card para manter o visual) */}
          <Card className="shadow-lg border-2 mt-6">
            <CardContent className="p-6">
              {canViewToWatch && (
                <TabsContent value="to-watch" className="mt-0">
                  <PaginatedList key="to-watch" username={username} status="TO_WATCH" searchTerm={searchTerm} />
                </TabsContent>
              )}
              {canViewWatching && (
                <TabsContent value="watching" className="mt-0">
                  <PaginatedList key="watching" username={username} status="WATCHING" searchTerm={searchTerm} />
                </TabsContent>
              )}
              {canViewWatched && (
                <TabsContent value="watched" className="mt-0">
                  <PaginatedList key="watched" username={username} status="WATCHED" searchTerm={searchTerm} />
                </TabsContent>
              )}
              {canViewDropped && (
                <TabsContent value="dropped" className="mt-0">
                  <PaginatedList key="dropped" username={username} status="DROPPED" searchTerm={searchTerm} />
                </TabsContent>
              )}
            </CardContent>
          </Card>
          
        </Tabs>
        // --- [FIM DA MUDANÇA 3] ---
      ) : (
        // Mensagem de fallback se TODAS as listas forem privadas
        <div className="flex flex-col items-center justify-center text-center p-12 bg-muted/50 rounded-lg">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Listas Privadas</h3>
          <p className="text-muted-foreground">O dono deste perfil tornou todas as suas listas privadas.</p>
        </div>
      )}
    </div>
  );
}