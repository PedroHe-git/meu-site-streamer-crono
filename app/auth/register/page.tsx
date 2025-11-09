"use client"; // Obrigatório para hooks como useState e useRouter

import { useState } from "react";
import { useRouter } from "next/navigation"; // Importa o router
import { Film, Mail, Lock, User, AtSign, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button"; // Caminho corrigido
import { Input } from "@/components/ui/input"; // Caminho corrigido
import { Label } from "@/components/ui/label"; // Caminho corrigido
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"; // Caminho corrigido
import { Alert, AlertDescription } from "@/components/ui/alert"; // Caminho corrigido

// Removemos os props 'onSuccess' e 'onSwitchToLogin', 
// pois vamos usar o router diretamente.
export default function RegisterPage() {
  const router = useRouter(); // Hook de navegação
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validações (do seu ficheiro)
    if (!name || !username || !email || !password) {
      setError("Todos os campos são obrigatórios.");
      setIsLoading(false);
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username inválido (apenas letras, números e _).");
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    // --- LÓGICA REAL (Substitui o setTimeout) ---
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          username,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Falha ao criar conta.");
      }

      // Sucesso
      setSuccess("Registro concluído! A redirecionar para o login...");
      setName("");
      setUsername("");
      setEmail("");
      setPassword("");
      
      // Redireciona para o login após 2 segundos
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
    // --- FIM DA LÓGICA REAL ---
  };

  const handleSwitchToLogin = () => {
    router.push('/auth/signin');
  };

  return (
    // O JSX do seu ficheiro RegisterPage.tsx vem aqui
    // (Copie e cole todo o 'return (...)' do seu ficheiro)
    <div className="flex items-center justify-center lg:grid lg:grid-cols-2 min-h-screen bg-background">
      {/* Coluna da Esquerda - Formulário */}
      <div className="flex items-center justify-center p-8 w-full">
        <Card className="w-full max-w-md border-2 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl w-fit">
              <Film className="h-10 w-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Criar Conta
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Comece a organizar seu cronograma de entretenimento
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="João Silva"
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <AtSign className="h-4 w-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="joaosilva"
                  required
                  pattern="^[a-zA-Z0-9_]+$"
                  title="Apenas letras, números e underscores (_)"
                  disabled={isLoading}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Será seu URL: meucronograma.live/<span className="text-purple-600">{username || "username"}</span>
                </p>
              </div>

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
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo 6 caracteres
                </p>
              </div>

              {/* Mensagens */}
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {success}
                  </AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Botão Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg"
              >
                {isLoading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <div className="text-sm text-center text-muted-foreground">
              Já tem uma conta?{" "}
              <button
                onClick={handleSwitchToLogin} // Lógica real
                className="font-semibold text-purple-600 hover:underline"
              >
                Fazer Login
              </button>
            </div>
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
            MeuCronograma
          </h1>
          <p className="text-xl mb-8 text-purple-100">
            Organize filmes, séries e animes em listas personalizadas
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Listas Personalizadas</p>
                <p className="text-sm text-purple-100">Organize o que vai assistir</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Agendamento Fácil</p>
                <p className="text-sm text-purple-100">Planeje suas sessões</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Perfil Público</p>
                <p className="text-sm text-purple-100">Compartilhe seu cronograma</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}