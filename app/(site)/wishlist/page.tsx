import { prisma } from "@/lib/prisma";
import { 
  Gift, 
  ExternalLink, 
  Gamepad2, 
  BookOpen, 
  Clapperboard, 
  Ghost, 
  PackageOpen, 
  Swords, 
  Puzzle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { unstable_cache } from "next/cache";

export const revalidate = 60;

const getCachedWishlistUrl = unstable_cache(
  async () => {
    const creator = await prisma.user.findFirst({ 
      where: { role: "CREATOR" },
      select: { amazonWishlistUrl: true } // Otimização: Selecionar só o campo necessário
    });
    return creator?.amazonWishlistUrl || "#";
  },
  ['wishlist-url-data'], 
  { revalidate: 86400, tags: ['user-profile'] } // 24 Horas de Cache
);

export default async function WishlistPage() {
  const creator = await prisma.user.findFirst({ where: { role: "CREATOR" } });
  const wishlistUrl = creator?.amazonWishlistUrl || "#";

  return (
    <main className="min-h-screen bg-[#09090b] text-white pt-24 pb-20 relative overflow-hidden font-sans selection:bg-yellow-500/30">
      
      {/* --- BACKGROUND TEMÁTICO --- */}
      {/* Círculos coloridos estilo "Luzes de LED" no fundo */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/grid.svg')] opacity-5 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 max-w-5xl">
        
        {/* --- CABEÇALHO "COLECIONADOR" --- */}
        <div className="flex flex-col items-center text-center mb-16 space-y-4">
          <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 px-4 py-1.5 text-xs font-bold uppercase tracking-widest bg-yellow-500/10 rounded-full mb-2">
            <Ghost className="w-3 h-3 mr-2" /> Collector Mode On
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
            Envie um <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600">Presente</span>
          </h1>
          
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            Seja um Funko raro, o próximo volume do mangá ou aquele game novo. 
            Ajude a expandir o universo do cenário com itens lendários!
          </p>
        </div>

        {/* --- CARD PRINCIPAL (LOOT BOX) --- */}
        <div className="relative group w-full max-w-3xl mx-auto mb-20">
          {/* Efeito de Borda Neon */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-purple-500 to-blue-500 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
          
          <div className="relative bg-[#121214] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 border border-white/5">
            
            {/* Ícone de Caixa Aberta */}
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
               <PackageOpen className="w-12 h-12 text-white" />
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <h2 className="text-2xl font-bold text-white">Envie um &quot;Loot&quot; Épico</h2>
              <p className="text-gray-400 text-sm md:text-base">
                Ao escolher um item na Amazon, ele chega direto aqui na &quot;Caverna&quot;. <br></br>
                Que será aberto em live!
              </p>
              
              <div className="pt-2">
                <Button 
                    asChild 
                    size="lg" 
                    className="w-full md:w-auto h-14 px-8 text-base font-bold rounded-xl bg-white text-black hover:bg-gray-200 transition-all hover:scale-105 shadow-xl"
                >
                    <a href={wishlistUrl} target="_blank" rel="noopener noreferrer">
                    Acessar Wishlist <ExternalLink className="ml-2 w-4 h-4" />
                    </a>
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* --- GRID DE CATEGORIAS (ESTILO ESTANTE) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Colecionáveis (Funko/Lego) */}
          <div className="group bg-gray-900/40 border border-white/5 p-6 rounded-2xl hover:border-yellow-500/50 hover:bg-gray-900/80 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-400 group-hover:scale-110 transition-transform">
                <Puzzle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-lg">Geek & Toys</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              De <strong>Funko Pops</strong> cabeçudos a sets complexos de <strong>LEGO</strong>. Itens que dão personalidade ao cenário.
            </p>
            {/* Tags decorativas */}
            <div className="flex flex-wrap gap-2">
                <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20">Pop!</span>
                <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20">Bricks</span>
            </div>
          </div>

          {/* Card 2: Games & Animes */}
          <div className="group bg-gray-900/40 border border-white/5 p-6 rounded-2xl hover:border-purple-500/50 hover:bg-gray-900/80 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <Swords className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-lg">Otaku & Gamer</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Mangás, Action Figures, Jogos e acessórios temáticos. O coração da nossa cultura.
            </p>
             {/* Tags decorativas */}
             <div className="flex flex-wrap gap-2">
                <span className="text-[10px] bg-purple-500/10 text-purple-500 px-2 py-1 rounded border border-purple-500/20">RPG</span>
                <span className="text-[10px] bg-purple-500/10 text-purple-500 px-2 py-1 rounded border border-purple-500/20">Anime</span>
            </div>
          </div>

          {/* Card 3: Livros e Cinema */}
          <div className="group bg-gray-900/40 border border-white/5 p-6 rounded-2xl hover:border-red-500/50 hover:bg-gray-900/80 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-red-500/10 text-red-400 group-hover:scale-110 transition-transform">
                <Clapperboard className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-lg">Lore & Cinema</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Livros de fantasia, artbooks de filmes e clássicos do cinema para expandir o conhecimento.
            </p>
             {/* Tags decorativas */}
             <div className="flex flex-wrap gap-2">
                <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20">Books</span>
                <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20">Movies</span>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}