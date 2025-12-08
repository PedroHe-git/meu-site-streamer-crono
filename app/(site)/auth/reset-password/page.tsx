// app/auth/reset-password/page.tsx

"use client";

// Importa 'Suspense' pois vamos usar 'useSearchParams'
import { useState, Suspense } from "react"; 
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FaRegBookmark } from 'react-icons/fa'; // Ícone da marca

// --- Componente do Formulário (Lógica Interna) ---
// Usamos um componente separado para podermos envolvê-lo em <Suspense>
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Lê o token da URL
  const token = searchParams.get('token');

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validação
    if (!token) {
      setError("Link inválido ou em falta. Por favor, solicite um novo link.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) { // Adiciona uma verificação de segurança
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }), // Envia o token e a nova senha
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Não foi possível redefinir a senha.");
      }

      setSuccess("Senha redefinida com sucesso! A redirecionar para o login...");
      
      // Envia o usuário para o login após o sucesso
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Redefinir Senha</CardTitle>
        <CardDescription className="text-muted-foreground">
          Digite sua nova senha abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="password" className="text-muted-foreground">Nova Senha</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              disabled={isLoading}
              className="placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassword" className="text-muted-foreground">Confirmar Nova Senha</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
              disabled={isLoading}
              className="placeholder:text-muted-foreground"
            />
          </div>

          {/* Mensagens de Feedback */}
          {success && <p className="text-sm text-green-600">{success}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={isLoading || !!success} className="w-full">
            {isLoading ? "A guardar..." : "Salvar Nova Senha"}
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
  );
}


// --- Layout da Página (com Suspense) ---
export default function ResetPasswordPage() {
  return (
    // Layout Split Screen
    <div className="flex items-center justify-center lg:grid lg:grid-cols-2 min-h-screen">

      {/* Coluna da Esquerda (Formulário) */}
      <div className="flex items-center justify-center p-8 w-full">
        {/* É OBRIGATÓRIO usar <Suspense> porque ResetPasswordForm usa 'useSearchParams' */}
        <Suspense fallback={<div className="text-center p-10 text-muted-foreground">A carregar...</div>}>
          <ResetPasswordForm />
        </Suspense>
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