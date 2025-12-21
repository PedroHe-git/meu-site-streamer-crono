"use client"; // <--- Isso é essencial!

import { useState, useEffect } from "react";

// Um tipo para ajudar o TypeScript a entender os dados
type StreamStatus = {
  isLive: boolean;
  gameName?: string;
  title?: string;
  viewerCount?: number;
};

export function TwitchPlayer() {
  // 1. Estados para guardar os dados e o status de carregamento
  const [status, setStatus] = useState<StreamStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Efeito para buscar os dados quando o componente carregar
  useEffect(() => {
    // Busca os dados da NOSSA API Route
    fetch("/api/twitch-status")
      .then((res) => res.json())
      .then((data: StreamStatus) => {
        setStatus(data);
      })
      .catch((err) => {
        console.error("Erro ao buscar status da Twitch:", err);
        setStatus({ isLive: false }); // Assume offline em caso de erro
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []); // O array vazio [] faz isso rodar apenas uma vez no cliente

  // 3. Função auxiliar para renderizar o conteúdo
  const renderContent = () => {
    // 3a. Mostra um placeholder enquanto carrega
    if (isLoading) {
      return (
        <div className="text-center">
          <p className="text-gray-400">Verificando status da live...</p>
        </div>
      );
    }

    // 3b. Mostra o banner "AO VIVO"
    if (status && status.isLive) {
      return (
        <a
          href={`https://twitch.tv/${process.env.NEXT_PUBLIC_TWITCH_CHANNEL_NAME || 'twitch'}`} // Você pode por seu canal direto aqui também
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center hover:opacity-90 transition-opacity p-8"
        >
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-md text-sm font-bold animate-pulse">
            AO VIVO
          </div>
          <h3 className="text-white text-xl md:text-2xl font-bold mb-2 px-10">
            {status.title || "Estamos ao vivo!"}
          </h3>
          <p className="text-purple-300 text-lg">
            {status.gameName || "Vem assistir!"}
          </p>
          <p className="text-gray-400 text-sm mt-4">
            {status.viewerCount ? `${status.viewerCount} espectadores` : ""}
          </p>
          <div className="mt-6 inline-flex items-center justify-center h-16 w-16 rounded-full bg-purple-600">
            <svg
              className="h-8 w-8 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="text-white mt-2 font-semibold">Clique para assistir</p>
        </a>
      );
    }

    // 3c. Mostra o banner "OFFLINE"
    return (
      <div className="text-center p-8">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gray-700 mb-4">
          <svg
            className="h-10 w-10 text-gray-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
          </svg>
        </div>
        <p className="text-gray-400 mb-2 text-xl font-bold">Offline</p>
        <p className="text-gray-500 text-sm">
          Acompanhe a agenda ou siga nas redes para saber da próxima live!
        </p>
      </div>
    );
  };

  return (
    <section id="inicio" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-center mb-8 font-medium">Transmissão Atual</h2>
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800 p-1">
            <div className="bg-black rounded-xl overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-black flex items-center justify-center relative">
                {/* O conteúdo dinâmico será renderizado aqui */}
                {renderContent()}
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-gray-700 text-sm font-medium">
              {status && status.isLive
                ? ` Ao vivo agora!`
                : (
                  <>
                    Lives todos os dias da semana <br />
                    (Acesse cronograma completo{" "}
                    <a
                      href="https://www.meucronograma.live/mahmoojen"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      aqui
                    </a>

                    )
                  </>
                )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}