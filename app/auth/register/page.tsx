"use client";

import { useState } from "react";
// import { signIn } from "next-auth/react"; // -> Import não utilizado, pode ser removido
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // -> Import não utilizado, pode ser removido
import { FaRegBookmark } from 'react-icons/fa'; 
// import { sendVerificationEmail } from "@/lib/email"; // <-- [ERRO CORRIGIDO] Esta linha foi removida

// --- Componente do Formulário (Lógica Interna) ---
function RegisterForm() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  //const [role, setRole] = useState<"CREATOR" | "VISITOR">("VISITOR");  // Correto - bloqueado
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError("");
    setSuccess(""); 
    setIsLoading(true);
    
    // Validações (Correto - !role removido)
    if (!name || !username || !email || !password) { 
      setError("Todos os campos são obrigatórios."); 
      setIsLoading(false); 
      return; 
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { 
      setError("Username inválido (letras, números, _)."); 
      setIsLoading(false); 
      return; 
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json", },
         // Correto - role removido do body
        body: JSON.stringify({ name, username, email, password }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao registrar"); 
      }

      setSuccess("Registro concluído! Por favor, verifique seu email para ativar sua conta.");
      setName("");
      setUsername("");
      setEmail("");
      setPassword("");
      // Correto - linha removida
      // setRole("VISITOR");

      setTimeout(() => {
        router.push('/auth/signin?status=registered');
      }, 4000); 

    } catch (err: any) { 
      setError(err.message);
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <Card className="w-full max-w-md">
      
      <CardHeader className="text-center">
        <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit">
          <FaRegBookmark className="h-8 w-8 text-primary" />
        </div>

        <CardTitle className="text-3xl font-bold pt-4">Crie sua conta</CardTitle>
        <CardDescription className="text-muted-foreground">
          Vamos começar a organizar suas mídias.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campos Name, Username, Email, Password */}
          <div className="space-y-1"> 
            <Label htmlFor="name" className="text-muted-foreground">Nome</Label> 
            <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} className="placeholder:text-muted-foreground"/> 
          </div>
          <div className="space-y-1"> 
            <Label htmlFor="username" className="text-muted-foreground">Username</Label> 
            <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required pattern="^[a-zA-Z0-9_]+$" title="Apenas letras, números e underscores (_)" disabled={isLoading} className="placeholder:text-muted-foreground"/> 
            <p className="text-xs text-muted-foreground">Será o seu URL público (ex: site.com/{username})</p> 
          </div>
          <div className="space-y-1"> 
            <Label htmlFor="email" className="text-muted-foreground">Email</Label> 
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className="placeholder:text-muted-foreground"/>
            <p className="text-xs text-muted-foreground">Um email de verificação será encaminhado</p> 
          </div>
          <div className="space-y-1"> 
            <Label htmlFor="password" className="text-muted-foreground">Senha</Label> 
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} className="placeholder:text-muted-foreground"/> 
          </div>

          {/* --- [SELEÇÃO DE ROLE COMENTADA - CORRETO] --- */}
          {/*<div className="space-y-2 pt-2">
              <Label className="text-muted-foreground">Qual o seu objetivo?</Label>
              
              <RadioGroup 
                value={role} 
                onValueChange={(value: "CREATOR" | "VISITOR") => setRole(value)} 
                disabled={isLoading}
                className="space-y-3 pt-1" 
              >
                
                <Label 
                  htmlFor="role-creator" 
                  className="flex items-start space-x-3 rounded-md border bg-card p-4 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                >
                  <RadioGroupItem value="CREATOR" id="role-creator" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">Criar e gerir cronogramas</span>
                    <span className="text-sm text-muted-foreground">
                      (Acesso ao Dashboard para organizar suas mídias)
                    </span>
                  </div>
                </Label>
                
                <Label 
                  htmlFor="role-visitor" 
                  className="flex items-start space-x-3 rounded-md border bg-card p-4 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                >
                  <RadioGroupItem value="VISITOR" id="role-visitor" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">Apenas visitar perfis</span>
                    <span className="text-sm text-muted-foreground">
                      Ver os cronogramas públicos de outros criadores.
                    </span>
                  </div>
                </Label>

              </RadioGroup>
          </div>*/}
          {/* --- [FIM DA SELEÇÃO] --- */}
          
          {success && <p className="text-sm text-green-600">{success}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "A registrar..." : "Registrar"}
          </Button>
        </form>
      </CardContent>
       <CardFooter className="text-sm text-center block text-muted-foreground">
        Já tem conta?{" "} 
        <Link href="/auth/signin" className="font-medium text-primary hover:underline">
          Faça login 
        </Link>
      </CardFooter>
    </Card>
  );
}

// --- Layout da Página (Permanece o mesmo) ---
export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center lg:grid lg:grid-cols-2 min-h-screen">

      {/* Coluna da Esquerda (Formulário) */}
      <div className="flex items-center justify-center p-8 w-full">
        <RegisterForm />
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