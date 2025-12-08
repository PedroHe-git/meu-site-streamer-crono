"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Importa o router
import { Film, Mail, ArrowLeft, Send, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button"; // Caminho corrigido
import { Input } from "@/components/ui/input"; // Caminho corrigido
import { Label } from "@/components/ui/label"; // Caminho corrigido
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // Caminho corrigido
import { Alert, AlertDescription } from "@/components/ui/alert"; // Caminho corrigido

export default function ForgotPasswordPage() {
  const router = useRouter(); // Hook de navegação
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!email) {
      setError("Por favor, insira seu email.");
      setIsLoading(false);
      return;
    }

    // --- LÓGICA REAL (Substitui o setTimeout) ---
    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Falha ao enviar email.");
      }

      setSuccess(`Enviamos um link de recuperação para ${email}. Verifique sua caixa de entrada.`);
      setEmail("");
      
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro.");
    } finally {
      setIsLoading(false);
    }
    // --- FIM DA LÓGICA REAL ---
  };

  const handleBackToLogin = () => {
    router.push('/auth/signin');
  };

  return (
    // O JSX do seu ficheiro ForgotPasswordPage.tsx vem aqui
    // (Copie e cole todo o 'return (...)' do seu ficheiro)
    <div className="flex items-center justify-center lg:grid lg:grid-cols-2 min-h-screen bg-background">
      {/* Coluna da Esquerda - Formulário */}
      <div className="flex items-center justify-center p-8 w-full">
        <Card className="w-full max-w-md border-2 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl w-fit">
              <Mail className="h-10 w-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Recuperar Senha
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Enviaremos um link de recuperação para seu email
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
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
                  disabled={isLoading}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Digite o email associado à sua conta
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg"
              >
                {isLoading ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Link de Recuperação
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              variant="ghost"
              onClick={handleBackToLogin} // Lógica real
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para o Login
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Coluna da Direita - Branding (do seu ficheiro) */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 p-10 relative overflow-hidden">
        {/* ... (resto da sua coluna de branding) ... */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="text-center max-w-md relative z-10 text-white">
          <Film className="mx-auto h-20 w-20 mb-8" />
          <h1 className="text-5xl font-bold mb-6">
            Não se preocupe!
          </h1>
          <p className="text-xl text-purple-100 mb-8">
            Acontece com todo mundo. Vamos recuperar sua conta em instantes.
          </p>
          <div className="space-y-6 text-left">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                <span className="font-bold">1</span>
              </div>
              <div>
                <p className="font-semibold">Digite seu email</p>
                <p className="text-sm text-purple-100">O email que você usou para criar a conta</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                <span className="font-bold">2</span>
              </div>
              <div>
                <p className="font-semibold">Verifique sua caixa de entrada</p>
                <p className="text-sm text-purple-100">Enviaremos um link seguro</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                <span className="font-bold">3</span>
              </div>
              <div>
                <p className="font-semibold">Crie uma nova senha</p>
                <p className="text-sm text-purple-100">E volte a organizar seu cronograma</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}