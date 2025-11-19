"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Loader2, User, X } from "lucide-react";
import Link from "next/link";

type SearchResult = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
};

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Efeito de busca com Debounce Manual
  useEffect(() => {
    const searchUsers = async () => {
      // Só busca se tiver pelo menos 2 caracteres
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setIsOpen(true);

      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Erro na busca", error);
      } finally {
        setIsLoading(false);
      }
    };

    // --- LÓGICA DE DEBOUNCE (MANUAL) ---
    // Espera 300ms depois que o usuário para de digitar para chamar a API
    const timeoutId = setTimeout(() => {
        if (query) searchUsers();
    }, 300);

    // Limpa o timer se o usuário digitar novamente antes dos 300ms
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="relative w-full max-w-md mx-auto" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Encontrar criadores..."
          className="pl-9 pr-10 bg-background/80 backdrop-blur-sm focus:bg-background transition-colors"
          value={query}
          onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length === 0) setIsOpen(false);
          }}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        />
        {query && (
            <button 
                onClick={() => { setQuery(""); setIsOpen(false); }}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
                <X className="h-4 w-4" />
            </button>
        )}
      </div>

      {/* Dropdown de Resultados */}
      {isOpen && (query.length >= 2) && (
        <div className="absolute top-full mt-2 w-full z-50 px-1">
          <Card className="overflow-hidden shadow-xl border-primary/20 animate-in fade-in zoom-in-95 duration-200 bg-popover text-popover-foreground">
            {isLoading ? (
              <div className="p-4 flex items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">A procurar...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhum criador encontrado.
              </div>
            ) : (
              <ul className="max-h-[300px] overflow-y-auto py-1">
                {results.map((user) => (
                  <li key={user.id}>
                    <Link 
                        href={`/${user.username}`} 
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-sm">
                        <span className="font-medium leading-none">{user.name || user.username}</span>
                        <span className="text-muted-foreground text-xs mt-0.5">@{user.username}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}