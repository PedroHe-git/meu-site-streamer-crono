// app/components/FollowButton.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// 1. Adicione 'disabled' às props
interface FollowButtonProps {
  initialIsFollowing: boolean;
  username: string; // O username do CRIADOR (a quem seguir)
  disabled?: boolean; // <-- MUDANÇA AQUI
}

export default function FollowButton({ 
  initialIsFollowing, 
  username, 
  disabled // <-- MUDANÇA AQUI
}: FollowButtonProps) {
  
  const router = useRouter();
  
  // Estado para o botão (controla o que o utilizador vê)
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  // Estado de loading para prevenir cliques duplos
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowToggle = async () => {
    setIsLoading(true);

    // --- Atualização Otimista ---
    // Muda o estado do botão imediatamente, antes da API responder.
    // Isto faz a UI parecer instantânea.
    const originalState = isFollowing;
    setIsFollowing(!originalState);

    try {
      // Chama a API que criámos (POST /api/users/[username]/follow)
      const res = await fetch(`/api/users/${username}/follow`, {
        method: "POST",
      });

      if (!res.ok) {
        // Se a API falhar, reverte o botão para o estado original
        setIsFollowing(originalState);
        const data = await res.json();
        console.error(data.error || "Falha ao seguir");
      }
      
      // Opcional: Recarrega a página (ou parte dela) para atualizar contagens, etc.
      // router.refresh(); 

    } catch (error) {
      console.error(error);
      // Reverte se a chamada 'fetch' falhar
      setIsFollowing(originalState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleFollowToggle}
      // 3. Combine o 'disabled' externo com o 'isLoading' interno
      disabled={isLoading || disabled} // <-- MUDANÇA AQUI
      // Muda o visual do botão com base no estado
      variant={isFollowing ? "outline" : "default"}
      size="sm"
    >
      {isLoading ? "A carregar..." : (isFollowing ? "Seguindo" : "Seguir")}
    </Button>
  );
}