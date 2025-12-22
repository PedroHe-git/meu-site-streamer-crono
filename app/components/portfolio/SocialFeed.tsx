"use client";

import { useEffect, useState } from "react";
import { Instagram, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image"; 

type SocialItem = {
  id: string;
  imageUrl: string;
  linkUrl: string;
  subtitle: string | null;
};

export function SocialFeed() {
  const [posts, setPosts] = useState<SocialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/social?platform=INSTAGRAM");
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        }
      } catch (error) {
        console.error("Erro ao carregar feed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (!isLoading && posts.length === 0) return null;

  return (
    <section id="social" className="py-20 bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4">
        
        <div className="flex flex-col items-center justify-center mb-12 text-center">
            <div className="p-3 bg-pink-100 rounded-full text-pink-600 mb-4">
                <Instagram className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-2">No Instagram</h2>
            <p className="text-gray-500">Bastidores e dia a dia.</p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
             <div className="flex justify-center p-10"><Loader2 className="animate-spin text-pink-500" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {posts.map((post) => (
                  <a
                    key={post.id}
                    href={post.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square overflow-hidden rounded-2xl group cursor-pointer bg-gray-200 block shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {post.imageUrl ? (
                      <Image
                        src={post.imageUrl}
                        alt="Instagram Post"
                        fill
                        unoptimized={true} // 👈 FIX
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <Instagram className="w-10 h-10 text-white" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                       <p className="text-white font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                          <Instagram className="w-5 h-5" /> 
                          Ver no Insta
                       </p>
                       {post.subtitle && (
                         <p className="text-gray-300 text-sm mt-1">{post.subtitle}</p>
                       )}
                    </div>
                  </a>
                ))}
            </div>
          )}
          
          <div className="text-center mt-12">
             <Button variant="outline" size="lg" className="border-pink-200 text-pink-600 hover:bg-pink-50" asChild>
                <a href="https://www.instagram.com/mahmoojen/" target="_blank">
                   Seguir Perfil Completo
                </a>
             </Button>
          </div>

        </div>
      </div>
    </section>
  );
}