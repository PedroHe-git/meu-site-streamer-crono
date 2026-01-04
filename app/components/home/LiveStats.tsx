import { prisma } from "@/lib/prisma";
import { Users, PlayCircle, MapPin, Tv, Gamepad2 } from "lucide-react";
import { MovieStatusType } from "@prisma/client"; // Certifique-se que o import está aqui

export default async function LiveStats() {
  const user = await prisma.user.findFirst({
    where: { role: "CREATOR" },
    select: {
        twitchFollowersCount: true,
        youtubeSubsCount: true,
        instagramFollowersCount: true,
        statRegion: true,
        id: true
    }
  });

  if (!user) return null;

  // Cálculos
  const totalFollowers = (user.twitchFollowersCount || 0) + (user.youtubeSubsCount || 0) + (user.instagramFollowersCount || 0);

  // Busca segura (usando o Enum correto)
  const mediaCount = await prisma.mediaStatus.count({
    where: {
      userId: user.id,
      status: { in: [MovieStatusType.WATCHED] } 
    }
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-8">
      
      {/* CARD 1: COMUNIDADE (Roxo/Rosa) */}
      <div className="group relative bg-black/40 border border-white/10 rounded-2xl p-5 overflow-hidden hover:border-purple-500/50 transition-all duration-300">
        {/* Efeito de brilho no fundo ao passar o mouse */}
        <div className="absolute inset-0 bg-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-black text-white leading-none mb-1">
                {formatNumber(totalFollowers)}
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-300/60 group-hover:text-purple-300">
                Comunidade
            </p>
          </div>
        </div>
      </div>

      {/* CARD 2: HISTÓRICO (Azul/Cyan) */}
      <div className="group relative bg-black/40 border border-white/10 rounded-2xl p-5 overflow-hidden hover:border-blue-500/50 transition-all duration-300">
        <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl font-black text-white leading-none mb-1">
                {mediaCount}+
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-300/60 group-hover:text-blue-300">
                Mídias 
            </p>
          </div>
        </div>
      </div>

      {/* CARD 3: REGIÃO (Verde/Esmeralda) */}
      <div className="group relative bg-black/40 border border-white/10 rounded-2xl p-5 overflow-hidden hover:border-green-500/50 transition-all duration-300">
        <div className="absolute inset-0 bg-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-green-500/20 rounded-xl text-green-400 group-hover:scale-110 transition-transform">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            {/* Trunca texto longo com '...' se a cidade for muito grande */}
            <div className="text-xl md:text-2xl font-black text-white leading-none mb-1 truncate max-w-[150px]" title={user.statRegion || "Brasil"}>
                {user.statRegion || "Brasil"}
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-green-300/60 group-hover:text-green-300">
                Região
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}