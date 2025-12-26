"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps, StaticImageData } from "next/image"; 
import { Film } from "lucide-react"; 

type NextImageProps = Omit<ImageProps, 'src'>;

interface ImageWithFallbackProps extends NextImageProps {
  fallback?: React.ReactNode;
  src: string | StaticImageData | null | undefined;
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
      src={src}
      onError={() => setError(true)}
      className={className}
      // 👇 A MÁGICA ACONTECE AQUI:
      // Isso desativa o processamento da Vercel para todas as imagens que usam esse componente.
      // Como a maioria vem do TMDB/IGDB (que já são otimizados), você economiza muito dinheiro/créditos.
      unoptimized={true} 
      {...props}
    />
  );
};