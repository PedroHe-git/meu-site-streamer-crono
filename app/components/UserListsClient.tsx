"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaginatedList from "./PaginatedList";
import { Lock, Search } from "lucide-react"; 
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

  // Lógica para determinar a aba padrão
  let defaultTab = "";
  if (canViewWatching) defaultTab = "watching";
  else if (canViewToWatch) defaultTab = "to-watch";
  else if (canViewWatched) defaultTab = "watched";
  else if (canViewDropped) defaultTab = "dropped";

  // Estado para controlar a aba ativa e renderização condicional
  const [activeTab, setActiveTab] = useState(defaultTab);

  const anyListVisible = canViewToWatch || canViewWatching || canViewWatched || canViewDropped;

  return (
    <div className="space-y-6">

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
        <Tabs 
          defaultValue={defaultTab} 
          value={activeTab} 
          onValueChange={setActiveTab} // Atualiza o estado ao mudar de aba
          className="w-full"
        >
          
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
          
          <Card className="shadow-lg border-2 mt-6">
            <CardContent className="p-6">
              {/* Renderização Condicional: Só carrega o PaginatedList se a aba estiver ativa */}
              {/* Isso evita fetches desnecessários para abas ocultas */}
              
              {canViewToWatch && (
                <TabsContent value="to-watch" className="mt-0">
                  {activeTab === "to-watch" && (
                    <PaginatedList key="to-watch" username={username} status="TO_WATCH" searchTerm={searchTerm} />
                  )}
                </TabsContent>
              )}
              
              {canViewWatching && (
                <TabsContent value="watching" className="mt-0">
                  {activeTab === "watching" && (
                    <PaginatedList key="watching" username={username} status="WATCHING" searchTerm={searchTerm} />
                  )}
                </TabsContent>
              )}
              
              {canViewWatched && (
                <TabsContent value="watched" className="mt-0">
                  {activeTab === "watched" && (
                    <PaginatedList key="watched" username={username} status="WATCHED" searchTerm={searchTerm} />
                  )}
                </TabsContent>
              )}
              
              {canViewDropped && (
                <TabsContent value="dropped" className="mt-0">
                  {activeTab === "dropped" && (
                    <PaginatedList key="dropped" username={username} status="DROPPED" searchTerm={searchTerm} />
                  )}
                </TabsContent>
              )}
            </CardContent>
          </Card>
          
        </Tabs>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-muted/50 rounded-lg">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Listas Privadas</h3>
          <p className="text-muted-foreground">O dono deste perfil tornou todas as suas listas privadas.</p>
        </div>
      )}
    </div>
  );
}