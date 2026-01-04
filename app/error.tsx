'use client'; // Obrigatório

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro para um serviço de reporte
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2>Algo deu errado!</h2>
      <button
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
        onClick={
          // Tenta recuperar tentando re-renderizar o segmento
          () => reset()
        }
      >
        Tentar novamente
      </button>
    </div>
  );
}