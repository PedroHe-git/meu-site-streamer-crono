// app/components/AppTour.tsx (Simplificado)

"use client";

import React from 'react';
import Joyride, { Step, CallBackProps } from 'react-joyride';

// 1. Define as props que o componente vai receber
interface AppTourProps {
  steps: Step[];
  run: boolean;
  onCallback: (data: CallBackProps) => void;
}

// 2. O componente agora é 'controlado' pelo pai
export default function AppTour({ steps, run, onCallback }: AppTourProps) {
  
  // 3. Removemos 'isMounted', 'useEffect' e 'runTour' daqui.
  // O erro de hidratação é resolvido porque 'run' será 'false'
  // na primeira renderização, então o Joyride não tentará montar nada.

  return (
    <Joyride
      steps={steps}
      run={run} // Controlado pelo pai
      callback={onCallback} // Controlado pelo pai
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      locale={{
        next: 'Próximo',
        back: 'Anterior',
        skip: 'Ignorar',
        last: 'Concluir',
      }}
      styles={{
        // ... (os seus estilos permanecem os mesmos) ...
        options: {
          arrowColor: '#333',
          backgroundColor: '#333',
          overlayColor: 'rgba(0, 0, 0, 0.8)',
          primaryColor: '#6366F1', 
          textColor: '#FFF',
          zIndex: 1000,
        },
        tooltip: {
          backgroundColor: '#333', 
        },
        buttonClose: {
          color: '#FFF',
        },
        buttonNext: {
          backgroundColor: '#6366F1',
        },
        buttonBack: {
          color: '#FFF',
        },
      }}
    />
  );
}