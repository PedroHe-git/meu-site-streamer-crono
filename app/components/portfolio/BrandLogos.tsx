import { getSponsors } from "@/lib/data";
import { Handshake } from "lucide-react";
import SponsorCard from "./SponsorCard";

export default async function BrandLogos() {
  const partners = await getSponsors(true);

  if (!partners || partners.length === 0) return null;

  return (
    <section className="py-24 bg-[#050505] relative overflow-hidden">
      
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {partners.map((partner) => (
            <SponsorCard key={partner.id} partner={partner} />
          ))}
        </div>
      </div>
    </section>
  );
}