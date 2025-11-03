"use client";

import { useState } from "react";
import Image from "next/image";
import { MediaType } from "@prisma/client";
// --- Importa componentes Shadcn ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
// --- FIM ---

// Tipagem
type NormalizedSearchResult = {
  source: 'MOVIE' | 'ANIME' | 'SERIES' | 'OUTROS'; // Adiciona OUTROS aqui por segurança
  sourceId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
};
type MediaSearchProps = { onMediaAdded: () => void; };

export default function MediaSearch({ onMediaAdded }: MediaSearchProps) {
  // Estados
  const [query, setQuery] = useState("");
  // Atualiza o tipo de estado para incluir OUTROS
  const [mediaType, setMediaType] = useState<"MOVIE" | "ANIME" | "SERIES" | "OUTROS">("MOVIE");
  const [results, setResults] = useState<NormalizedSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualYear, setManualYear] = useState("");
  const [manualPoster, setManualPoster] = useState("");
  const [isWeekly, setIsWeekly] = useState(false);

  // handleSearch (com o bloqueio para 'OUTROS')
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Bloqueia a busca API para "OUTROS"
    if (mediaType === "OUTROS") {
      setMessage("Não é possível buscar 'Outros'. Por favor, adicione manualmente.");
      setResults([]);
      setShowManualForm(true); // Abre o formulário manual
      return; 
    }

    if (showManualForm) setShowManualForm(false);
    setLoading(true); setMessage(""); setResults([]);
    try {
      let apiUrl = "";
      if (mediaType === "MOVIE") apiUrl = `/api/search?query=${query}`;
      else if (mediaType === "ANIME") apiUrl = `/api/search-anime?query=${query}`;
      else apiUrl = `/api/search-series?query=${query}`; // 'OUTROS' é bloqueado acima
      
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`Falha na busca de ${mediaType}`);
      const data = await res.json();
      let normalizedData: NormalizedSearchResult[] = [];
      if (mediaType === "MOVIE") { normalizedData = data.map((movie: any) => ({ source: 'MOVIE', sourceId: movie.id, title: movie.title, posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null, releaseYear: movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null, }));}
      else if (mediaType === "ANIME") { normalizedData = data.map((anime: any) => ({ source: 'ANIME', sourceId: anime.mal_id, title: anime.title, posterPath: anime.images?.jpg?.image_url || null, releaseYear: anime.year, })); }
      else { normalizedData = data.map((serie: any) => ({ source: 'SERIES', sourceId: serie.id, title: serie.name, posterPath: serie.poster_path ? `https://image.tmdb.org/t/p/w500${serie.poster_path}` : null, releaseYear: serie.first_air_date ? parseInt(serie.first_air_date.split('-')[0]) : null, })); }
      setResults(normalizedData);
    } catch (error) { setMessage(`Erro ao buscar ${mediaType}.`);
    } finally { setLoading(false); }
  };

  // addToList (já está correto, pois envia 'isWeekly' para todos os tipos)
  const addToList = async (media: NormalizedSearchResult, status: "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED") => {
    setMessage(`Adicionando "${media.title}"...`);
    try {
      const res = await fetch("/api/mediastatus", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType: media.source,
          tmdbId: (media.source === 'MOVIE' || media.source === 'SERIES' || media.source === 'OUTROS') ? media.sourceId : null,
          malId: media.source === 'ANIME' ? media.sourceId : null,
          title: media.title, posterPath: media.posterPath, releaseYear: media.releaseYear, status: status,
          isWeekly: (media.source === 'ANIME' || media.source === 'SERIES' || media.source === 'OUTROS') ? isWeekly : false, // A lógica aqui já inclui 'OUTROS' implicitamente
        }),
      });
      if (!res.ok) { let errorMsg = "Falha ao adicionar"; try { const d = await res.json(); errorMsg = d.error || errorMsg; } catch (_) {} throw new Error(errorMsg); }
      
      setMessage(`"${media.title}" adicionado!`);
      setIsWeekly(false);
      onMediaAdded();
      setResults([]);
      setQuery("");
      setTimeout(() => setMessage(""), 2000);
      
    } catch (error: any) { setMessage(`Erro: ${error.message || '?'}`); setTimeout(() => setMessage(""), 3000); }
  };

  // handleManualAdd (já está correto)
  const handleManualAdd = async (e: React.FormEvent, status: "TO_WATCH" | "WATCHING" | "WATCHED" | "DROPPED") => {
    e.preventDefault(); if (!manualTitle) { setMessage("Título obrigatório."); return; }
    if (manualPoster && !manualPoster.startsWith('https://i.imgur.com/')) { setMessage("URL inválida (Imgur). Use 'Copiar Endereço da Imagem'."); setTimeout(() => setMessage(""), 4000); return; }
    setMessage(`Adicionando "${manualTitle}"...`); setLoading(true);
    try {
      const res = await fetch("/api/mediastatus", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType: mediaType, tmdbId: null, malId: null, title: manualTitle, posterPath: manualPoster || null, releaseYear: manualYear ? parseInt(manualYear) : null, status: status,
          isWeekly: (mediaType === MediaType.ANIME || mediaType === MediaType.SERIES || mediaType === MediaType.OUTROS) ? isWeekly : false, // A lógica aqui já inclui 'OUTROS'
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Falha manual"); }
      
      setMessage(`"${manualTitle}" adicionado!`);
      onMediaAdded();
      setShowManualForm(false);
      setManualTitle("");
      setManualYear("");
      setManualPoster("");
      setIsWeekly(false);
      setResults([]);
      setQuery("");
      setTimeout(() => setMessage(""), 2000);

    } catch (error: any) { setMessage(`Erro: ${error.message || '?'}`); setTimeout(() => setMessage(""), 3000);
    } finally { setLoading(false); }
  };

  const placeholderText = mediaType === 'MOVIE' ? 'Filme' : mediaType === 'ANIME' ? 'Anime' : mediaType === 'SERIES' ? 'Série' : 'Mídia';

  return (
    <div>
      {/* Formulário de Busca */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <Select
              value={mediaType}
              // Atualiza o tipo do 'onValueChange'
              onValueChange={(value: "MOVIE" | "ANIME" | "SERIES" | "OUTROS") => {
                  setMediaType(value);
                  setIsWeekly(false);
              }}
          >
            <SelectTrigger className="w-[120px] flex-shrink-0">
                <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="MOVIE">Filme</SelectItem>
                <SelectItem value="ANIME">Anime</SelectItem>
                <SelectItem value="SERIES">Série</SelectItem>
                <SelectItem value="OUTROS">Outros</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar ${placeholderText}...`} required 
            // Desabilita a barra de busca se "Outros" for selecionado
            disabled={mediaType === 'OUTROS'}
            className="flex-grow placeholder:text-muted-foreground" 
          />
        </div>
        <Button type="submit" disabled={loading || mediaType === 'OUTROS'} className="w-full">
          {loading && !showManualForm ? "Buscando..." : "Buscar"}
        </Button>
      </form>

      {/* Botão Toggle Adição Manual */}
      <div className="text-center mt-3">
        <Button
          type="button" variant="link"
          onClick={() => { setShowManualForm(!showManualForm); setIsWeekly(false); }}
          disabled={loading} 
          className="text-sm text-primary h-auto p-0"
        >
          {showManualForm ? "Cancelar Adição Manual" : (mediaType === 'OUTROS' ? "Adicionar 'Outros' manualmente" : "Não encontrou? Adicione manualmente")}
        </Button>
      </div>

      {/* Formulário Manual */}
      {showManualForm && (
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 mt-4 p-4 border rounded-md bg-secondary">
          <h3 className="font-semibold text-lg text-foreground">Adicionar Mídia Manualmente</h3>
          <div>
            <Label className="text-sm font-medium text-foreground">Tipo</Label> 
            <Select value={mediaType} onValueChange={(value: any) => { setMediaType(value); setIsWeekly(false); }}>
                <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="MOVIE">Filme</SelectItem>
                    <SelectItem value="ANIME">Anime</SelectItem>
                    <SelectItem value="SERIES">Série</SelectItem>
                    <SelectItem value="OUTROS">Outros</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="manualTitle" className="text-sm font-medium text-foreground">Título (Obrigatório)</Label> 
            <Input id="manualTitle" type="text" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder={`Ex: O Filme da Minha Vida`} required className="mt-1 placeholder:text-muted-foreground" /> 
          </div>
          <div>
            <Label htmlFor="manualYear" className="text-sm font-medium text-foreground">Ano (Opcional)</Label> 
            <Input id="manualYear" type="number" value={manualYear} onChange={(e) => setManualYear(e.target.value)} placeholder="Ex: 2025" className="mt-1 placeholder:text-muted-foreground" /> 
          </div>
          <div>
            <Label htmlFor="manualPoster" className="text-sm font-medium text-foreground">URL Pôster (Opc. - Imgur)</Label> 
            <p className="text-xs text-muted-foreground mb-1"> Use &lsquo;Copiar Endereço da Imagem&rsquo; no <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="text-primary underline">Imgur</a>. </p>
            <Input id="manualPoster" type="text" value={manualPoster} onChange={(e) => setManualPoster(e.target.value)} placeholder="https://i.imgur.com/..." className="mt-1 placeholder:text-muted-foreground" /> 
          </div>
          
          {/* --- [MUDANÇA VISUAL AQUI (1)] --- */}
          {/* Mostra o checkbox se for ANIME, SERIES, ou OUTROS */}
          {(mediaType === MediaType.ANIME || mediaType === MediaType.SERIES || mediaType === MediaType.OUTROS) && (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="isWeeklyManual" checked={isWeekly} onCheckedChange={(checked) => setIsWeekly(Boolean(checked))} />
                <Label htmlFor="isWeeklyManual" className="text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Marcar como item semanal?
                </Label>
              </div>
          )}
          {/* --- [FIM DA MUDANÇA] --- */}
          
          <div className="flex gap-2 pt-2">
              <Button onClick={(e) => handleManualAdd(e, "TO_WATCH")} disabled={loading || !manualTitle} variant="secondary" className="flex-1 h-8 text-xs"> {loading ? "..." : "Ad. Próximos Conteúdos"} </Button>
              <Button onClick={(e) => handleManualAdd(e, "WATCHING")} disabled={loading || !manualTitle} variant="secondary" className="flex-1 h-8 text-xs"> {loading ? "..." : "Ad. Essa Semana"} </Button>
              <Button onClick={(e) => handleManualAdd(e, "WATCHED")} disabled={loading || !manualTitle} variant="secondary" className="flex-1 h-8 text-xs"> {loading ? "..." : "Ad. Já Assistido"} </Button>
          </div>
        </form>
      )}

      {/* Mensagem */}
      {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}

      {/* Lista de Resultados */}
      <ul className="mt-4 space-y-2 max-h-96 overflow-y-auto">
          
          {/* --- [MUDANÇA VISUAL AQUI (2)] --- */}
          {/* Mostra o checkbox se for ANIME, SERIES, ou OUTROS */}
          {(mediaType === MediaType.ANIME || mediaType === MediaType.SERIES || mediaType === MediaType.OUTROS) && results.length > 0 && (
            <div className="flex items-center space-x-2 mb-2 p-2 bg-muted rounded border">
                <Checkbox id="isWeeklySearch" checked={isWeekly} onCheckedChange={(checked) => setIsWeekly(Boolean(checked))} />
                <Label htmlFor="isWeeklySearch" className="text-sm font-medium text-foreground"> Marcar itens adicionados como semanais? </Label>
            </div>
          )}
          {/* --- [FIM DA MUDANÇA] --- */}
          
        {results.map((media) => (
          <li key={`${media.source}-${media.sourceId}`} className="flex items-center justify-between gap-2 p-2 border bg-card rounded-md" >
            
            <div className="flex items-center gap-3 overflow-hidden"> 
              <Image src={ media.posterPath || "/poster-placeholder.png" } width={40} height={60} alt={media.title} className="rounded flex-shrink-0" unoptimized={true} priority={false}/> 
              <span className="text-sm truncate text-foreground" title={media.title}>{media.title}</span> 
            </div>
            
            <div className="flex flex-col gap-1 flex-shrink-0">
                <Button onClick={() => addToList(media, "TO_WATCH")} size="sm" variant="outline" className="h-6 px-2 text-xs"> Próximos Conteúdos </Button>
                {/* Mostra "A Ver" se for ANIME, SERIES, ou OUTROS */}
                {(media.source === 'ANIME' || media.source === 'SERIES' || media.source === 'OUTROS') && (
                  <Button onClick={() => addToList(media, "WATCHING")} size="sm" variant="outline" className="h-6 px-2 text-xs"> Essa Semana </Button>
                )}
                <Button onClick={() => addToList(media, "WATCHED")} size="sm" variant="outline" className="h-6 px-2 text-xs"> Já Assistido </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}