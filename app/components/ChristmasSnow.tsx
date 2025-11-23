"use client";

import { useEffect, useState } from "react";

// Adicionei uma leve cor azulada para o modo claro e branca para o escuro
const snowStyles = `
@keyframes snowfall {
  0% {
    transform: translateY(-10px) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) translateX(20px);
    opacity: 0.3;
  }
}
`;

export default function ChristmasSnow() {
  const [snowflakes, setSnowflakes] = useState<number[]>([]);

  useEffect(() => {
    const flakes = Array.from({ length: 50 }, (_, i) => i);
    setSnowflakes(flakes);
    
    if (!document.getElementById('snow-styles')) {
      const style = document.createElement('style');
      style.id = 'snow-styles';
      style.innerHTML = snowStyles;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden" aria-hidden="true">
      {snowflakes.map((i) => {
        const left = Math.random() * 100;
        const animationDuration = 10 + Math.random() * 20; 
        const animationDelay = Math.random() * -20;
        const opacity = 0.4 + Math.random() * 0.6; // Aumentei a opacidade mínima
        const size = Math.random() * 10 + 5;

        return (
          <div
            key={i}
            // CORRIGIDO: text-blue-300 no light mode, text-white no dark mode
            className="absolute top-[-20px] select-none text-blue-300 dark:text-white"
            style={{
              left: `${left}%`,
              opacity: opacity,
              fontSize: `${size}px`,
              animation: `snowfall ${animationDuration}s linear infinite`,
              animationDelay: `${animationDelay}s`,
              // Sombra azulada no light, branca no dark para brilho
              textShadow: '0 0 2px rgba(147, 197, 253, 0.8)' 
            }}
          >
            ❄
          </div>
        );
      })}
    </div>
  );
}