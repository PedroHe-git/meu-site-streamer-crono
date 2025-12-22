
import { getSponsors } from "@/lib/data";
import { Handshake, Mail, ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";


type Sponsor = {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  linkUrl: string;
  description: string;
};

export default async function BrandLogos() {
  
  // Busca os dados (Se estiver em cache, nem toca no banco)
  const partners = await getSponsors();

  return (
    <section className="py-24 bg-[#050505] relative overflow-hidden">
      
      {/* Elementos de Fundo (Luzes) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Cabeçalho */}
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold tracking-wider uppercase border border-purple-500/20 mb-4">
            <Handshake className="w-3 h-3" />
            Hall de Parceiros
          </span>
          <h3 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Quem faz o show <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">acontecer</span>
          </h3>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Marcas incríveis que confiam no nosso conteúdo e fortalecem a comunidade.
          </p>
        </div>

        {/* Grid Premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          
          {partners.map((partner) => (
            <a 
              key={partner.id}
              href={partner.linkUrl || "#"}
              target={partner.linkUrl ? "_blank" : "_self"}
              className="group relative flex flex-col items-center text-center p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)]"
            >
              {/* Categoria (Tag no topo) */}
              {partner.category && (
                <span className="absolute top-4 right-4 text-[10px] font-mono text-gray-500 bg-black/40 px-2 py-1 rounded border border-white/5 group-hover:text-white group-hover:border-purple-500/30 transition-colors">
                    {partner.category}
                </span>
              )}

              {/* Área da Logo com Glow */}
              <div className="relative mb-6 w-24 h-24 flex items-center justify-center">
                {/* Glow atrás da logo */}
                <div className="absolute inset-0 bg-white/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <img 
                   src={partner.imageUrl} 
                   alt={partner.name} 
                   className="w-full h-full object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 relative z-10" 
                />
              </div>

              {/* Textos */}
              <div className="space-y-2 relative z-10">
                <h4 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors flex items-center justify-center gap-2">
                   {partner.name}
                   {partner.linkUrl && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />}
                </h4>
                <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors leading-relaxed line-clamp-2">
                  {partner.description || "Parceiro oficial do canal."}
                </p>
              </div>

              {/* Borda Gradient Inferior (Detalhe) */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent group-hover:w-3/4 transition-all duration-700 opacity-50" />
            </a>
          ))}

          {/* Card de "Seja um Patrocinador" 
          <div className="group relative rounded-2xl border border-dashed border-gray-800 bg-gray-900/20 p-8 flex flex-col items-center justify-center text-center hover:bg-gray-900/40 hover:border-purple-500/40 transition-all duration-300 min-h-[280px]">
             <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Mail className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
             </div>
             
             <h4 className="text-xl font-bold text-white mb-2">Espaço Disponível</h4>
             <p className="text-gray-500 text-sm mb-6 max-w-[200px]">
               Sua marca pode aparecer aqui para milhares de pessoas.
             </p>
             
             <Button variant="ghost" className="group/btn text-purple-400 hover:text-white hover:bg-purple-600/20" asChild>
                <Link href="/contato" className="flex items-center gap-2">
                   Mídia Kit <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
             </Button>
          </div> */}

        </div>
      </div>
    </section>
  );
}