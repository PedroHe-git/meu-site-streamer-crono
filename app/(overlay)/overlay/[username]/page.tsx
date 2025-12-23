"use client";

import { useEffect, useState } from "react";
import Image from "next/image"; 

export default function OverlayPage({ params }: { params: { username: string } }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/users/${params.username}/overlay`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Erro no overlay", error);
      }
    };

    fetchData(); 
    const interval = setInterval(fetchData, 5000); 

    return () => clearInterval(interval); 
  }, [params.username]); 

  if (!data || !data.current) return null;

  const item = data.current;
  const media = item.media;

  return (
    <div className="w-full h-screen flex items-end p-16 overflow-hidden">
      
      {/* CARD GIGANTE */}
      <div className="flex items-center gap-8 bg-black/85 text-white p-8 rounded-3xl border-l-[12px] border-primary shadow-2xl animate-in slide-in-from-bottom-10 duration-700 max-w-4xl w-full">
        
        {/* Poster */}
        <div className="relative h-60 w-40 flex-shrink-0 bg-gray-800 rounded-xl overflow-hidden shadow-lg">
             {media.posterPath ? (
               <Image
                 src={media.posterPath} 
                 alt={media.title}
                 fill
                 className="object-cover"
                 unoptimized={true} 
               />
             ) : (
               <div className="w-full h-full bg-gray-700 flex items-center justify-center opacity-50">
                 No Image
               </div>
             )}
        </div>

        {/* Textos */}
        <div className="flex flex-col min-w-0 flex-1 justify-center">
          <span className="text-xl uppercase tracking-[0.2em] text-primary font-black mb-2 shadow-black drop-shadow-md">
            A Assistir Agora
          </span>
          
          <h1 className="text-5xl font-extrabold leading-tight line-clamp-2 text-white drop-shadow-lg mb-2">
            {media.title}
          </h1>
          
          {(item.seasonNumber || item.episodeNumber) && (
            <div className="flex items-center gap-4 text-2xl text-gray-200 font-semibold">
               {item.seasonNumber && <span className="bg-white/10 px-3 py-1 rounded-md">Temporada {item.seasonNumber}</span>}
               {item.episodeNumber && <span className="bg-white/10 px-3 py-1 rounded-md">Episódio {item.episodeNumber}</span>}
            </div>
          )}
          
          {data.next && (
             <div className="mt-5 border-t border-white/20 pt-3">
               <p className="text-xl text-gray-400 truncate flex items-center gap-2">
                 <span className="uppercase text-sm font-bold tracking-wider opacity-70">A seguir:</span> 
                 <span className="text-white font-medium">{data.next.media.title}</span>
               </p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}