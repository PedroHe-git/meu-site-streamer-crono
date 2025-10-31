// app/auth/forgot-password/page.tsx

"use client"; // Esta página precisa de estado (email, erro, sucesso)

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FaRegBookmark } from 'react-icons/fa'; // Ícone da marca

// Este é o componente principal da página
export default function ForgotPasswordPage() {
  
  // Estados do formulário
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Lógica de envio
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Algo deu errado");
      }

      setSuccess("Link de recuperação enviado! Por favor, verifique seu email.");
      setEmail(""); // Limpa o campo após o sucesso

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Layout Split Screen (igual ao login/registro)
    <div className="flex items-center justify-center lg:grid lg:grid-cols-2 min-h-screen">

      {/* Coluna da Esquerda (Formulário) */}
      <div className="flex items-center justify-center p-8 w-full">
        
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Esqueceu a senha?</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sem problemas. Digite seu email e enviaremos um link de redefinição.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  disabled={isLoading}
                  placeholder="seu.email@exemplo.com"
                  className="placeholder:text-muted-foreground"
                />
              </div>

              {/* Mensagens de Feedback */}
              {success && <p className="text-sm text-green-600">{success}</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "A enviar..." : "Enviar link de recuperação"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-sm text-center block text-muted-foreground">
            Lembrou a senha?{" "}
            <Link href="/auth/signin" className="font-medium text-primary hover:underline">
              Fazer login
            </Link>
          </CardFooter>
        </Card>

      </div>

      {/* Coluna da Direita (Branding/Visual) */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-muted p-10">
        <div className="text-center max-w-md">
          <FaRegBookmark className="mx-auto h-16 w-16 text-primary" />
          <h1 className="mt-6 text-4xl font-bold text-foreground">
            MeuCronograma
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Seu universo de filmes, séries e animes, finalmente organizado.
          </p>
        </div>
      </div>
      
    </div>
  );
}