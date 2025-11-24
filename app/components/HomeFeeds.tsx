"use client";

import { useEffect, useState, useRef } from "react"; // Adicionado useRef
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, Loader2, User, Compass, Heart, ArrowRight, Tv } from "lucide-react"; 
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type CreatorSummary = {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
    twitchUsername: string | null;
    itemCount: number;
};

const CreatorCard = ({ creator }: { creator: CreatorSummary }) => {
    return (
        <Link href={`/${creator.username}`} className="block h-full">
            <Card className="h-full relative overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 group cursor-pointer bg-card/50 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-5 flex items-start gap-4 relative z-10">
                    <div className="relative">
                        <Avatar className="h-14 w-14 border-2 border-background shadow-sm group-hover:border-primary transition-colors duration-300">
                            <AvatarImage src={creator.image || undefined} />
                            <AvatarFallback><User className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                        </Avatar>
                        {creator.twitchUsername && (
                            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5" title="Canal da Twitch vinculado">
                                <div className="bg-[#9146FF] text-white p-1 rounded-full w-5 h-5 flex items-center justify-center">
                                    <Tv className="h-3 w-3" />
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors pr-2">
                                {creator.name || creator.username}
                            </h3>
                            <ArrowRight className="h-4 w-4 text-muted-foreground/50 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-3">@{creator.username}</p>
                        
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-secondary/50 text-secondary-foreground px-2.5 py-1 rounded-md border border-transparent group-hover:border-primary/20 transition-colors">
                            <CalendarDays className="h-3.5 w-3.5 opacity-70" />
                            <span>
                                <strong>{creator.itemCount}</strong> {creator.itemCount === 1 ? 'item' : 'itens'} esta semana
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

export default function HomeFeeds() {
  const [following, setFollowing] = useState<CreatorSummary[]>([]);
  const [discover, setDiscover] = useState<CreatorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false); // Proteção contra duplo fetch em React 18 Strict Mode

  useEffect(() => {
    if (fetchedRef.current) return; // Evita rodar duas vezes
    fetchedRef.current = true;

    const loadData = async () => {
      try {
        // Executa em paralelo
        const [resFollow, resDiscover] = await Promise.all([
            fetch("/api/feed/following", { next: { revalidate: 60 } }), // Cache curto no cliente para following
            fetch("/api/feed/discover", { next: { revalidate: 3600 } }) // Cache longo no cliente para discover
        ]);
        
        if (resFollow.ok) setFollowing(await resFollow.json());
        if (resDiscover.ok) setDiscover(await resDiscover.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm">A carregar o feed...</p>
        </div>
    );
  }

  return (
    <div className="space-y-16 animate-in fade-in duration-700 slide-in-from-bottom-4">
      
      {/* SECÇÃO 1: QUEM VOCÊ SEGUE */}
      <section>
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <Heart className="h-5 w-5 text-red-600 dark:text-red-400 fill-current" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Acompanhar</h2>
                    <p className="text-sm text-muted-foreground">Novidades de quem você segue</p>
                </div>
            </div>
            {following.length > 0 && (
                <Badge variant="outline" className="h-6">
                    Seguindo {following.length}
                </Badge>
            )}
        </div>

        {following.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {following.map(creator => (
                    <CreatorCard key={creator.id} creator={creator} />
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl bg-muted/10 text-center">
                <div className="bg-muted p-3 rounded-full mb-3">
                    <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">O seu feed está vazio</h3>
                <p className="text-muted-foreground text-sm max-w-xs mt-1">
                    Siga criadores para ver os seus cronogramas aqui. Confira as sugestões abaixo!
                </p>
            </div>
        )}
      </section>

      {/* SECÇÃO 2: DESCOBRIR */}
      {discover.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <Compass className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Descobrir Comunidade</h2>
                    <p className="text-sm text-muted-foreground">Criadores ativos que talvez goste</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {discover.map(creator => (
                    <CreatorCard key={creator.id} creator={creator} />
                ))}
            </div>
          </section>
      )}
    </div>
  );
}