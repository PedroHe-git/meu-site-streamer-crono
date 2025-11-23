"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Opcional: Logar o erro em um serviço de monitoramento
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <div className="bg-yellow-100 dark:bg-yellow-900/20 p-6 rounded-full mb-6">
        <AlertTriangle className="h-12 w-12 text-yellow-600 dark:text-yellow-500" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Ops! Algo deu errado.</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Não foi possível carregar os dados. Estamos com uma alta demanda no momento ou em manutenção temporária.
      </p>
      <Button onClick={() => reset()}>Tentar novamente</Button>
    </div>
  );
}