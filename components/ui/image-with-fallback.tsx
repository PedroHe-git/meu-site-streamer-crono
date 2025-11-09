"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { Film } from "lucide-react"; // Usaremos um ícone como fallback

// Combina as props do Next/Image com as nossas
interface ImageWithFallbackProps extends ImageProps {
  fallback?: React.ReactNode;
  src: string | null | undefined; // <-- A CORREÇÃO CRÍTICA: Aceita null | undefined
}

export const ImageWithFallback = ({
  src,
  fallback,
  alt,
  className,
  ...props
}: ImageWithFallbackProps) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    // Reseta o erro se o src mudar
    setError(false);
  }, [src]);

  // Se não houver src ou se der erro, mostra o fallback
  if (error || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className || ''}`}
        // Passa as props restantes (como width, height) para o div 
        // para manter o layout
        style={{ 
          width: props.width ? `${props.width}px` : '100%', 
          height: props.height ? `${props.height}px` : '100%',
        }}
      >
        {fallback || <Film className="h-6 w-6" />}
      </div>
    );
  }

  // Se funcionar, renderiza a imagem
  return (
    <Image
      alt={alt}
      src={src} // 'src' aqui está garantido como sendo uma string
      onError={() => setError(true)} // Se der erro, muda o estado
      className={className}
      {...props}
    />
  );
};