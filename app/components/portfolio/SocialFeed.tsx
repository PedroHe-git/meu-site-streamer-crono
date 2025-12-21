"use client";

import { Instagram } from "lucide-react";
import { useState, useEffect } from "react";

type Post = {
  id: number | string; // Aceita string para IDs falsos
  image: string;
  likes: number;
  postUrl: string;
};

// Dados falsos para não quebrar o site se a API falhar
const MOCK_POSTS: Post[] = [
  { id: 1, image: "/avatar-streamer.png", likes: 1200, postUrl: "#" },
  { id: 2, image: "/avatar-streamer.png", likes: 850, postUrl: "#" },
  { id: 3, image: "/avatar-streamer.png", likes: 2000, postUrl: "#" },
];

export function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("/api/instagram");
        if (!response.ok) throw new Error("Falha API");
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.warn("Instagram falhou, usando dados de exemplo.");
        setPosts(MOCK_POSTS); // <--- O PULO DO GATO: Usa mock se der erro
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <section id="social" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-center mb-8 text-2xl font-bold">Últimos do Instagram</h2>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {isLoading 
              ? Array(3).fill(0).map((_, i) => (
                  <div key={`skeleton-${i}`} className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
                ))
              : posts.map((post) => (
                  <a
                    key={post.id}
                    href={post.postUrl}
                    target="_blank"
                    className="relative aspect-square overflow-hidden rounded-lg group cursor-pointer bg-gray-100 block"
                  >
                    <img
                      src={post.image}
                      alt="Instagram Post"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      // Se a imagem falhar, mostra um fundo cinza
                      onError={(e) => {e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.style.backgroundColor = '#ddd'}}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">
                       ❤️ {(post.likes / 1000).toFixed(1)}k
                    </div>
                  </a>
                ))
            }
          </div>
        </div>
      </div>
    </section>
  );
}