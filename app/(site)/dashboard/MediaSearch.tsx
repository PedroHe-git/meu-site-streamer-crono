"use client";

import { useState } from "react";
// --- [MUDANÇA 1] ---
// Importamos o ícone 'Check' para a mensagem de sucesso
import { Search, Loader2, Plus, Film, AlertCircle, Check } from "lucide-react";
// --- [FIM MUDANÇA 1] ---
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
type MediaType = "MOVIE" | "ANIME" | "SERIES" | "GAME" | "OUTROS";
type StatusKey = "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED";

type SearchResult = {
  source: MediaType;
  tmdbId: number | null;
  malId: number | null;
  igdbId?: number | null;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
};

type MediaSearchProps = {
  onMediaAdded: () => void;
};

export default function MediaSearch({ onMediaAdded }: MediaSearchProps) {
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("MOVIE");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingState, setAddingState] = useState<string | null>(null);

  // --- [MUDANÇA 2] ---
  // Separamos as mensagens de erro e sucesso
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); // <-- NOVO ESTADO
  // --- [FIM MUDANÇA 2] ---

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
    setSuccessMessage(""); // <-- Limpa a mensagem de sucesso
    setResults([]);

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
      case "GAME":
        apiUrl = `/api/search-games?q=${encodeURIComponent(query)}`;
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

    // --- [MUDANÇA 3] ---
    // Limpa ambas as mensagens ao iniciar a adição
    setMessage("");
    setSuccessMessage("");
    // --- [FIM MUDANÇA 3] ---

    if ("source" in media) {
      const idKey = media.tmdbId || media.malId || media.igdbId;

      if (!idKey) {
        setMessage("Este item não pode ser adicionado (ID em falta).");
        return;
      }

      key = `${media.source}-${idKey}-${status}`;

      mediaData = {
        title: media.title,
        mediaType: media.source,
        tmdbId: media.tmdbId,
        malId: media.malId,
        igdbId: media.igdbId || null,
        posterPath: media.posterPath,
        status: status,
      };
    } else {
      key = `${media.type}-${media.title}-${status}`;
      mediaData = {
        title: media.title,
        mediaType: media.type,
        tmdbId: null,
        malId: null,
        igdbId: null,
        posterPath: media.posterUrl,
        status: status,
      };

      if (media.type !== 'OUTROS' && media.type !== 'GAME') {
        setMessage("Para adicionar manualmente Filmes, Séries ou Animes, use a busca (recomendado) ou selecione 'Outros'/'Jogos'.");
        return;
      }
    }

    setAddingState(key);

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

      // --- [INÍCIO DA MUDANÇA 4] ---
      // Feedback visual e limpeza da UI
      setSuccessMessage(`"${mediaData.title}" foi adicionado com sucesso!`);

      if ("source" in media) {
        // Se foi da busca, limpa a busca e os resultados
        setResults([]);
        setQuery("");
      } else {
        // Se foi manual, limpa o formulário manual
        setManualTitle("");
        setManualPoster("");
        setManualType("OUTROS");
        setShowManualForm(false);
      }
      // --- [FIM DA MUDANÇA 4] ---

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
                <SelectItem value="GAME">Jogos</SelectItem>
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
                  Próximos Conteúdos
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

        {/* --- [INÍCIO DA MUDANÇA 5] --- */}
        {/* Mensagens de Erro/Aviso/Sucesso */}
        {message && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {message}
            </AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert className="mt-4 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-300">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}
        {/* --- [FIM DA MUDANÇA 5] --- */}


        {/* Resultados da Busca */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {results.map((media) => {
            
            // [CORREÇÃO] Agora aceita igdbId
            const idKey = media.tmdbId || media.malId || media.igdbId;
            
            if (!idKey) {
              return null; 
            }

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
                  unoptimized={true}
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
                      {addingState === toWatchKey ? <Loader2 className="h-3 w-3 animate-spin" /> : "Para Assistir"}
                    </Button>

                    {/* [CORREÇÃO] Exibir botão 'Essa Semana' também para Jogos (GAME) */}
                    {(media.source === "ANIME" || media.source === "SERIES" || media.source === "GAME" || media.source === "MOVIE" ) && (
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
                      {addingState === watchedKey ? <Loader2 className="h-3 w-3 animate-spin" /> : "Assistido"}
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