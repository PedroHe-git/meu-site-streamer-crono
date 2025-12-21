import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Twitch, Instagram } from "lucide-react"; 

interface AboutProps {
  user: {
    name: string | null;
    username: string;
    image: string | null;
    bio: string | null;
    twitchUsername: string | null;
  };
}

export default function AboutSection({ user }: AboutProps) {
  return (
    <section id="sobre" className="py-20 bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* Lado Esquerdo: Imagem */}
          <div className="md:order-1 flex justify-center relative group">
            {/* Efeito de brilho atrás da foto */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            
            <div className="relative w-64 h-64 md:w-96 md:h-96 rounded-full overflow-hidden border-4 border-gray-800 shadow-2xl">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "Avatar"}
                  fill
                  className="object-cover hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                  Sem Foto
                </div>
              )}
            </div>
          </div>

          {/* Lado Direito: Texto */}
          <div className="md:order-2 text-center md:text-left space-y-6">
            <div>
                <h2 className="text-sm font-bold text-purple-500 uppercase tracking-widest mb-2">
                    Sobre o Streamer
                </h2>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                    Olá, eu sou <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">{user.name || user.username}</span>
                </h1>
            </div>

            <div className="text-gray-300 text-lg leading-relaxed space-y-4">
              {user.bio ? (
                // Renderiza a bio do banco (aceita quebras de linha simples)
                user.bio.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))
              ) : (
                <p>O criador ainda não escreveu uma biografia.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
              {user.twitchUsername && (
                <Button asChild className="bg-[#9146FF] hover:bg-[#772ce8] text-white font-bold px-6 py-6 h-auto">
                  <a href={`https://twitch.tv/${user.twitchUsername}`} target="_blank" rel="noopener noreferrer">
                    <Twitch className="mr-2 w-5 h-5" />
                    Seguir na Twitch
                  </a>
                </Button>
              )}
              
              <Button asChild variant="outline" className="border-gray-700 bg-transparent text-white hover:bg-gray-800 px-6 py-6 h-auto">
                 <a href="/redes">
                    <Instagram className="mr-2 w-5 h-5" />
                    Ver Mais Redes
                 </a>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}