// app/components/AppTour.tsx (Atualizado)

"use client";

import dynamic from 'next/dynamic';
import { Props } from 'react-joyride';
import { useState, useEffect } from 'react'; // 1. Importar hooks

// Carrega o Joyride dinamicamente APENAS no lado do cliente
const Joyride = dynamic(() => import('react-joyride'), { ssr: false });

const AppTour = (props: Props) => {
  // 2. Adicionar estado para verificar se está no cliente
  const [isClient, setIsClient] = useState(false);

  // 3. Definir o estado como true APÓS a montagem do componente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 4. NÃO renderizar NADA se não estivermos no cliente
  // Isso garante que o HTML do servidor e o da hidratação inicial sejam idênticos
  if (!isClient) {
    return null;
  }

  // 5. Renderizar o Joyride APENAS no cliente, após a hidratação
  return (
    <Joyride
      {...props}
      continuous
      showProgress
      showSkipButton
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        skip: 'Pular',
      }}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#007bff', 
          arrowColor: '#ffffff',
        },
        tooltip: {
          backgroundColor: '#ffffff',
          color: '#333333',
          borderRadius: '8px',
        },
        buttonNext: {
          backgroundColor: '#007bff',
          color: '#ffffff',
          borderRadius: '4px',
        },
        buttonBack: {
          color: '#555555',
        },
        buttonSkip: {
          color: '#555555',
        },
      }}
    />
  );
};

export default AppTour;