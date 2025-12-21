import { ArrowRight, Download, Film, Tv, Youtube, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SponsorsPage() {
  
  // SEU LINK DE CONTATO
  const WHATSAPP_LINK = "https://incentive.gg/mahmoojen"; 

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 pb-20 relative overflow-hidden">
      
      {/* Luzes de Fundo */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        
        {/* --- HERO SECTION --- */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
            Para Patrocinar <br></br><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Filmes, Séries e Animes</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Acesse nosso <strong>INCENTIVE</strong> para patrocinar conteúdos dedicados, reacts e maratonas.
            
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-105 transition-all"
              asChild
            >
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                Acessar Incentive <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
          </div>
        </div>

        {/* --- GRID DE PREÇOS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          
          {/* CARD 1: FILMES */}
          <div className="bg-gray-900/40 border border-white/5 backdrop-blur-sm rounded-2xl p-6 hover:border-purple-500/30 transition-all group">
            <div className="w-12 h-12 bg-purple-900/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Film className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Filmes</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-gray-400">Até 02:00h</span>
                <span className="font-bold text-white">R$ 120,00</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-gray-400">Até 02:30h</span>
                <span className="font-bold text-white">R$ 150,00</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-2">
                <span className="text-gray-400">Até 03:00h</span>
                <span className="font-bold text-white">R$ 180,00</span>
              </div>
            </div>
          </div>

          {/* CARD 2: SÉRIES E ANIMES */}
          <div className="bg-gray-900/40 border border-white/5 backdrop-blur-sm rounded-2xl p-6 hover:border-pink-500/30 transition-all group relative overflow-hidden">
             {/* Tag de Aviso */}
             <div className="absolute top-0 right-0 bg-pink-600/20 text-pink-300 text-[10px] px-2 py-1 rounded-bl-lg font-bold">
                TEMP. COMPLETA
             </div>

            <div className="w-12 h-12 bg-pink-900/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Tv className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Séries & Animes</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-gray-400">Anime (20min)</span>
                <span className="font-bold text-white">R$ 30,00 <span className="text-[10px] text-gray-500">/ep</span></span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-gray-400">Série (&lt;25min)</span>
                <span className="font-bold text-white">R$ 30,00 <span className="text-[10px] text-gray-500">/ep</span></span>
              </div>
              <div className="flex justify-between items-center text-sm pb-2">
                <span className="text-gray-400">Série (50min)</span>
                <span className="font-bold text-white">R$ 60,00 <span className="text-[10px] text-gray-500">/ep</span></span>
              </div>
            </div>
            <p className="mt-4 text-xs text-pink-400/80 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Apenas temporadas completas.
            </p>
          </div>

          {/* CARD 3: REACTS */}
          <div className="bg-gray-900/40 border border-white/5 backdrop-blur-sm rounded-2xl p-6 hover:border-red-500/30 transition-all group">
            <div className="w-12 h-12 bg-red-900/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Youtube className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Reacts</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-gray-400">Até 15 min</span>
                <span className="font-bold text-white">R$ 30,00</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-gray-400">Até 25 min</span>
                <span className="font-bold text-white">R$ 40,00</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500 pb-2">
                <span>Acima de 25m</span>
                <span className="text-xs">Consulte</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
                Valor para 1 vídeo único.
            </p>
          </div>

           {/* CARD 4: SHORTS */}
           <div className="bg-gray-900/40 border border-white/5 backdrop-blur-sm rounded-2xl p-6 hover:border-yellow-500/30 transition-all group">
            <div className="w-12 h-12 bg-yellow-900/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Shorts</h3>
            
            <div className="flex flex-col items-center justify-center h-32 border border-dashed border-white/10 rounded-xl bg-black/20">
                <span className="text-4xl font-black text-white">R$ 5,00</span>
                <span className="text-sm text-gray-400 mt-1">por unidade</span>
            </div>

            <p className="mt-6 text-xs text-gray-500 text-center leading-relaxed">
                Vídeos curtos verticais para TikTok, Reels e YouTube Shorts.
            </p>
          </div>

        </div>

        {/* Nota de Rodapé */}
        <div className="max-w-4xl mx-auto mt-12 text-center border-t border-white/5 pt-8">
            <p className="text-gray-500 text-sm">
                * Os valores podem sofrer alterações sem aviso prévio. O pagamento garante que o conteúdo seja visto em live.
                <br />
                Para combos personalizados ou parcerias de longo prazo, entre em contato.
            </p>
        </div>

      </div>
    </main>
  );
}