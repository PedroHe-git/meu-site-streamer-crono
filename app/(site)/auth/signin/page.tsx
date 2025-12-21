"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, AlertCircle, LayoutDashboard } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaTwitch } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState<boolean | 'google' | 'credentials' | 'twitch'>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading('credentials');

    if (!email || !password) {
      setError("Preencha todos os campos.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
            setError("Email ou senha inválidos.");
        } else {
            setError(result.error);
        }
        setIsLoading(false);
      } else if (result?.ok) {
        // Redireciona direto para o painel administrativo
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError("Ocorreu um erro inesperado. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsLoading('google');
    signIn('google', {
      callbackUrl: '/dashboard', // Login social também vai para dashboard
    });
  };

  const handleTwitchSignIn = () => {
    setIsLoading('twitch');
    signIn('twitch', {
      callbackUrl: '/dashboard', 
    });
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black">
      
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-4 bg-primary rounded-2xl w-fit">
            <Lock className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              Área Administrativa
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Acesso exclusivo para gerenciamento
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Botões de Login Social */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-11 border-2"
              onClick={handleGoogleSignIn}
              disabled={!!isLoading}
            >
              <FcGoogle className="h-5 w-5 mr-2" />
              {isLoading === 'google' ? "Aguarde..." : "Entrar com Google"}
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 border-2 bg-[#9146FF] text-white hover:bg-[#772ce8] hover:text-white border-[#9146FF]"
              onClick={handleTwitchSignIn}
              disabled={!!isLoading}
            >
              <FaTwitch className="h-5 w-5 mr-2" />
              {isLoading === 'twitch' ? "Aguarde..." : "Entrar com Twitch"}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Ou use suas credenciais
              </span>
            </div>
          </div>

          {/* Formulário de Email/Senha */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={!!isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Senha
                </Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Esqueceu?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={!!isLoading}
                className="h-11"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={!!isLoading}
              className="w-full h-11 text-lg font-semibold"
            >
              {isLoading === 'credentials' ? "Verificando..." : "Acessar Painel"}
            </Button>
          </form>
        </CardContent>
        {/* Footer removido pois não há mais registro */}
      </Card>
    </div>
  );
}