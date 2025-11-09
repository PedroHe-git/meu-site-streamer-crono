"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Film, Mail, Lock, AlertCircle } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaTwitch } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
        // --- [CORREÇÃO DE MENSAGEM] ---
        // Altera a mensagem de erro padrão do NextAuth
        if (result.error === "CredentialsSignin") {
            setError("Email ou senha inválidos.");
        } else {
            setError(result.error);
        }
        // --- [FIM DA CORREÇÃO] ---
        setIsLoading(false);
      } else if (result?.ok) {
        router.push('/');
      }
    } catch (err) {
      setError("Ocorreu um erro inesperado. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsLoading('google');
    signIn('google', {
      callbackUrl: '/', 
    });
  };

  const handleTwitchSignIn = () => {
    setIsLoading('twitch');
    signIn('twitch', {
      callbackUrl: '/', 
    });
  };

  const handleSwitchToRegister = () => {
    router.push('/auth/register');
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return (
    // --- [INÍCIO DA MUDANÇA VISUAL] ---
    // Removemos o layout lg:grid-cols-2
    // Adicionamos um gradiente subtil ao fundo
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      
      {/* O Card agora está centrado e tem uma sombra mais pronunciada */}
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl w-fit">
            <Film className="h-10 w-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Bem-vindo de volta!
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Acesse sua conta MeuCronograma
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* OAuth Buttons */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-11 border-2"
              onClick={handleGoogleSignIn}
              disabled={!!isLoading}
            >
              <FcGoogle className="h-5 w-5 mr-2" />
              {isLoading === 'google' ? "Aguarde..." : "Continuar com Google"}
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 border-2 bg-[#9146FF] text-white hover:bg-[#772ce8] hover:text-white border-[#9146FF]"
              onClick={handleTwitchSignIn}
              disabled={!!isLoading}
            >
              <FaTwitch className="h-5 w-5 mr-2" />
              {isLoading === 'twitch' ? "Aguarde..." : "Continuar com Twitch"}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Ou continue com email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
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
                placeholder="joao@exemplo.com"
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
                  className="text-sm font-medium text-purple-600 hover:underline"
                >
                  Esqueceu a senha?
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
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg"
            >
              {isLoading === 'credentials' ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="text-sm text-center text-muted-foreground">
            Não tem uma conta?{" "}
            <button
              onClick={handleSwitchToRegister}
              className="font-semibold text-purple-600 hover:underline"
            >
              Criar Conta
            </button>
          </div>
        </CardFooter>
      </Card>

      {/* A Coluna da Direita (Branding) foi removida */}
      {/* --- [FIM DA MUDANÇA VISUAL] --- */}
    </div>
  );
}