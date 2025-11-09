"use client";

import { useState, useEffect } from "react";
// --- [INÍCIO DA CORREÇÃO 1] ---
// 'StaticImport' não é um tipo exportado. O tipo correto é 'StaticImageData'
import Image, { ImageProps, StaticImageData } from "next/image"; 
// --- [FIM DA CORREÇÃO 1] ---
import { Film } from "lucide-react"; 

// --- [INÍCIO DA CORREÇÃO 2] ---
// 1. Removemos o 'src' original das props do Next/Image
type NextImageProps = Omit<ImageProps, 'src'>;

// 2. Criamos a nossa interface que combina as props do Next/Image (sem o 'src')
//    com a nossa nova 'src' que aceita null/undefined.
interface ImageWithFallbackProps extends NextImageProps {
  fallback?: React.ReactNode;
  src: string | StaticImageData | null | undefined; // Tipo 'src' corrigido e alargado
}
// --- [FIM DA CORREÇÃO 2] ---

export const ImageWithFallback = ({
  src,
  fallback,
  alt,
  className,
  ...props // 'props' agora é do tipo NextImageProps
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
      src={src} // 'src' aqui está garantido como sendo uma string ou StaticImageData
      onError={() => setError(true)} // Se der erro, muda o estado
      className={className}
      {...props}
    />
  );
};