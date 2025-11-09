"use client"; 

import { useState } from "react";
import { Search, Loader2, Plus, Film, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Tipos
type MediaType = "MOVIE" | "ANIME" | "SERIES" | "OUTROS";
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";

// --- [INÍCIO DA CORREÇÃO 1] ---
// O tipo agora espera 'tmdbId' e 'malId', que é o que as APIs enviam.
type SearchResult = {
  source: MediaType;
  tmdbId: number | null; 
  malId: number | null;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
};
// --- [FIM DA CORREÇÃO 1] ---

type MediaSearchProps = {
  onMediaAdded: () => void; // Esta prop é chamada para re-fetch
};

export default function MediaSearch({ onMediaAdded }: MediaSearchProps) {
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("MOVIE");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingState, setAddingState] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);

  // Estados para o formulário manual
  const [manualTitle, setManualTitle] = useState("");
  const [manualType, setManualType] = useState<MediaType>("OUTROS");
  const [manualPoster, setManualPoster] = useState("");

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setMessage("");
    setResults([]);

    // Determina a API baseada no tipo
    let apiUrl: string;
    switch (mediaType) {
      case "MOVIE":
        apiUrl = `/api/search?q=${encodeURIComponent(query)}`;
        break;
      case "ANIME":
        apiUrl = `/api/search-anime?q=${encodeURIComponent(query)}`;
        break;
      case "SERIES":
        apiUrl = `/api/search-series?q=${encodeURIComponent(query)}`;
        break;
      default:
        setLoading(false);
        setMessage("Tipo de mídia 'OUTROS' não é pesquisável.");
        return;
    }

    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Falha ao buscar mídias");
      const data = await res.json();
      
      if (!data || data.length === 0) {
        setMessage("Nenhum resultado encontrado.");
      }
      setResults(data);
    } catch (err: any) {
      setMessage(err.message || "Erro ao buscar.");
    } finally {
      setLoading(false);
    }
  };

  const addToList = async (
    media: SearchResult | { title: string; type: MediaType; posterUrl: string },
    status: StatusKey
  ) => {
    let mediaData: any;
    let key: string;

    if ("source" in media) {
      // Mídia da API
      // --- [INÍCIO DA CORREÇÃO 2] ---
      // Lemos o ID correto (tmdbId OU malId)
      const idKey = media.tmdbId || media.malId; 

      if (!idKey) {
        setMessage("Este item não pode ser adicionado (ID em falta).");
        return;
      }

      key = `${media.source}-${idKey}-${status}`;
      
      // "Traduzimos" para o formato que a API /api/mediastatus espera
      mediaData = {
        title: media.title,
        mediaType: media.source,  // Envia 'mediaType'
        tmdbId: media.tmdbId,     // Envia 'tmdbId' (pode ser null)
        malId: media.malId,       // Envia 'malId' (pode ser null)
        posterPath: media.posterPath, // Envia 'posterPath'
        status: status,
      };
      // --- [FIM DA CORREÇÃO 2] ---

    } else {
      // Mídia Manual
      key = `${media.type}-${media.title}-${status}`;
      mediaData = {
        title: media.title,
        mediaType: media.type, 
        tmdbId: null,
        malId: null,
        posterPath: media.posterUrl, 
        status: status,
      };

      // --- [INÍCIO DA CORREÇÃO 3] ---
      // Impede o erro 400 ao adicionar manualmente.
      // Apenas 'OUTROS' pode ser adicionado sem ID.
      if (media.type !== 'OUTROS') {
        setMessage("Para adicionar manualmente Filmes, Séries ou Animes, use a busca ou selecione o tipo 'Outros'.");
        return;
      }
      // --- [FIM DA CORREÇÃO 3] ---
    }

    setAddingState(key);
    setMessage("");

    try {
      const res = await fetch("/api/mediastatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mediaData),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao adicionar");
      }
      
      onMediaAdded(); // Chama o handler do pai para re-fetch
      
      if (!("source" in media)) {
        setManualTitle("");
        setManualPoster("");
        setShowManualForm(false);
      }
      
    } catch (err: any) {
      setMessage(err.message || "Erro ao adicionar.");
    } finally {
      setAddingState(null);
    }
  };

  const handleManualFormSubmit = (e: React.FormEvent, status: StatusKey) => {
    e.preventDefault();
    if (!manualTitle.trim()) {
      setMessage("Título manual é obrigatório.");
      return;
    }
    addToList(
      { title: manualTitle, type: manualType, posterUrl: manualPoster || "" },
      status
    );
  };

  return (
    <Card className="shadow-lg border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-6 w-6" />
          Buscar Novas Mídias
        </CardTitle>
        <CardDescription>
          Pesquise por Filmes, Séries ou Animes para adicionar às suas listas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário de Busca */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: Duna, Attack on Titan..."
            className="flex-1"
          />
          <div className="flex gap-2">
            <Select
              value={mediaType}
              onValueChange={(v) => setMediaType(v as MediaType)}
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MOVIE">Filme</SelectItem>
                <SelectItem value="SERIES">Série</SelectItem>
                <SelectItem value="ANIME">Anime</SelectItem>
                <SelectItem value="OUTROS">Outros</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={loading || mediaType === "OUTROS"}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Buscar</span>
            </Button>
          </div>
        </form>

        {/* Checkbox para Adição Manual */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="manual-add"
            checked={showManualForm}
            onCheckedChange={(checked) => setShowManualForm(!!checked)}
          />
          <Label htmlFor="manual-add" className="cursor-pointer">
            Adicionar mídia manualmente
          </Label>
        </div>

        {/* Formulário Manual */}
        {showManualForm && (
          <Card className="bg-muted/50 p-4">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-title">Título</Label>
                <Input
                  id="manual-title"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Título da mídia"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-type">Tipo</Label>
                  <Select
                    value={manualType}
                    onValueChange={(v) => setManualType(v as MediaType)}
                  >
                    <SelectTrigger id="manual-type">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MOVIE">Filme</SelectItem>
                      <SelectItem value="SERIES">Série</SelectItem>
                      <SelectItem value="ANIME">Anime</SelectItem>
                      <SelectItem value="OUTROS">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-poster">URL do Pôster (Opcional)</Label>
                  <Input id="manualPoster" type="text" value={manualPoster} onChange={(e) => setManualPoster(e.target.value)} placeholder="https://i.imgur.com/..." className="mt-1 placeholder:text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mb-1"> Use &lsquo;Copiar Endereço da Imagem&rsquo; no <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="text-primary underline">Imgur</a>. </p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">Adicionar à lista:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={(e) => handleManualFormSubmit(e, "TO_WATCH")}
                  disabled={addingState !== null || !manualTitle}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Próximos
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => handleManualFormSubmit(e, "WATCHING")}
                  disabled={addingState !== null || !manualTitle}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Essa Semana
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => handleManualFormSubmit(e, "WATCHED")}
                  disabled={addingState !== null || !manualTitle}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Assistido
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Mensagens de Erro/Aviso */}
        {message && (
          <Alert variant={message.includes("Nenhum") ? "default" : "destructive"} className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* Resultados da Busca */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {results.map((media) => {
            
            // --- [INÍCIO DA CORREÇÃO 4] ---
            // Usamos 'tmdbId' ou 'malId' (o que existir) como a chave
            const idKey = media.tmdbId || media.malId;
            
            // Filtra resultados "quebrados" que não têm ID (corrige o "MOVIE-undefined")
            if (!idKey) {
              return null; 
            }
            // --- [FIM DA CORREÇÃO 4] ---

            const uniqueKey = `${media.source}-${idKey}`;
            const toWatchKey = `${uniqueKey}-TO_WATCH`;
            const watchingKey = `${uniqueKey}-WATCHING`;
            const watchedKey = `${uniqueKey}-WATCHED`;

            return (
              <div
                key={uniqueKey}
                className="flex gap-3 p-3 bg-muted/50 rounded-lg shadow-sm"
              >
                <ImageWithFallback
                  src={media.posterPath}
                  alt={media.title}
                  width={80}
                  height={120}
                  className="rounded-md object-cover"
                />
                <div className="flex flex-col justify-between w-full">
                  <div>
                    <h4 className="font-semibold line-clamp-2">
                      {media.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {media.releaseYear}
                      <Badge variant="outline" className="ml-2 scale-90">
                        {media.source}
                      </Badge>
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addToList(media, "TO_WATCH")}
                      disabled={addingState !== null}
                      className="h-7 px-2 text-xs"
                    >
                      {addingState === toWatchKey ? <Loader2 className="h-3 w-3 animate-spin" /> : "Próximos Conteúdos"}
                    </Button>
                    {(media.source === "ANIME" || media.source === "SERIES") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToList(media, "WATCHING")}
                        disabled={addingState !== null}
                        className="h-7 px-2 text-xs"
                      >
                        {addingState === watchingKey ? <Loader2 className="h-3 w-3 animate-spin" /> : "Essa Semana"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addToList(media, "WATCHED")}
                      disabled={addingState !== null}
                      className="h-7 px-2 text-xs"
                    >
                      {addingState === watchedKey ? <Loader2 className="h-3 w-3 animate-spin" /> : "Já Assistido"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}