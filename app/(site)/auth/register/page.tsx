"use client"; 

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Film, Mail, Lock, User, AtSign, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RegisterPage() {
  const router = useRouter(); 
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState(""); // <-- ADICIONADO
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // <-- ADICIONADO
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // --- [INÍCIO DAS NOVAS VALIDAÇÕES] ---
    if (!name || !username || !email || !confirmEmail || !password || !confirmPassword) {
      setError("Todos os campos são obrigatórios.");
      setIsLoading(false);
      return;
    }
    
    if (email !== confirmEmail) {
      setError("Os emails não coincidem.");
      setIsLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username inválido (apenas letras, números e _).");
      setIsLoading(false);
      return;
    }
    
    if (password.length < 8) { // MUDADO DE 6 PARA 8
      setError("A senha deve ter pelo menos 8 caracteres.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setIsLoading(false);
      return;
    }
    // --- [FIM DAS NOVAS VALIDAÇÕES] ---

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
        throw new Error(data.error || "Falha ao criar conta.");
      }

      setSuccess("Conta criada! Por favor, verifique seu email para ativar a conta. A redirecionar para o login...");
      setName("");
      setUsername("");
      setEmail("");
      setConfirmEmail(""); // <-- ADICIONADO
      setPassword("");
      setConfirmPassword(""); // <-- ADICIONADO
      
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000); 

    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    router.push('/auth/signin');
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      
      <Card className="w-full max-w-md shadow-2xl border-none">
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

              {/* --- [NOVO CAMPO: Confirmar Email] --- */}
              <div className="space-y-2">
                <Label htmlFor="confirm-email" className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Confirmar Email
                </Label>
                <Input
                  id="confirm-email"
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="Repita seu email"
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              {/* --- [FIM DO NOVO CAMPO] --- */}

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
                  Mínimo 8 caracteres {/* <-- MUDADO DE 6 PARA 8 */}
                </p>
              </div>

              {/* --- [NOVO CAMPO: Confirmar Senha] --- */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Confirmar Senha
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              {/* --- [FIM DO NOVO CAMPO] --- */}


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
  );
}