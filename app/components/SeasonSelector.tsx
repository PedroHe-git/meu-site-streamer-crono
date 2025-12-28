"use client";

import { useState } from "react";
import { Check, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface SeasonSelectorProps {
  mediaId: string;
  totalSeasons: number;
  currentProgress: Record<string, boolean> | null;
  mediaTitle: string;
}

export function SeasonSelector({ 
  mediaId, 
  totalSeasons, 
  currentProgress,
  mediaTitle 
}: SeasonSelectorProps) {
  // Estado local para refletir as mudanças instantaneamente
  const [progress, setProgress] = useState<Record<string, boolean>>(currentProgress || {});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleToggle = async (season: number, checked: boolean) => {
    // 1. Atualiza visualmente na hora (Optimistic UI)
    setProgress((prev) => ({ ...prev, [season]: checked }));

    // 2. Envia para o servidor em background
    try {
      const res = await fetch("/api/media/season", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, seasonNumber: season, isCompleted: checked }),
      });

      if (!res.ok) throw new Error("Falha ao salvar");

    } catch (error) {
      // Reverte se der erro
      setProgress((prev) => ({ ...prev, [season]: !checked }));
      toast({
        title: "Erro",
        description: "Não foi possível salvar o progresso da temporada.",
        variant: "destructive",
      });
    }
  };

  // Calcula quantas estão assistidas para mostrar no botão
  const watchedCount = Object.values(progress).filter(Boolean).length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-dashed border-gray-700 hover:border-purple-500 hover:bg-purple-500/10 hover:text-purple-400"
        >
          <Layers className="w-4 h-4" />
          Temporadas
          {watchedCount > 0 && (
             <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30">
               {watchedCount}/{totalSeasons || "?"}
             </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm bg-black/95 border-gray-800 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-500" />
            Progresso: {mediaTitle}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[300px] w-full pr-4 mt-2">
          <div className="flex flex-col gap-3">
            {totalSeasons > 0 ? (
              Array.from({ length: totalSeasons }).map((_, i) => {
                const seasonNum = i + 1;
                const isWatched = progress[seasonNum] || false;

                return (
                  <div 
                    key={seasonNum} 
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isWatched 
                        ? "bg-purple-900/10 border-purple-500/30" 
                        : "bg-gray-900/50 border-gray-800"
                    }`}
                  >
                    <div className="flex flex-col">
                        <span className={`font-medium ${isWatched ? "text-purple-300" : "text-gray-300"}`}>
                            Temporada {seasonNum}
                        </span>
                        <span className="text-xs text-gray-500">
                            {isWatched ? "Concluída" : "Não assistida"}
                        </span>
                    </div>
                    
                    <Switch
                      checked={isWatched}
                      onCheckedChange={(checked) => handleToggle(seasonNum, checked)}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 py-10">
                Nenhuma informação de temporadas disponível.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}