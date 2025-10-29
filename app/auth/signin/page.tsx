"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
// Remove useRouter, já não é necessário para este redirecionamento
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from 'react-icons/fc';
import { FaTwitch } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const dynamic = 'force-dynamic';

function SignInForm() {
  // Remove useRouter
  // const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState<boolean | 'google' | 'twitch' | 'credentials'>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setIsLoading('credentials');
    try {
      console.log("Tentando signIn com credentials...");
      const result = await signIn("credentials", {
        redirect: false, // Mantém false
        email,
        password,
      });

      console.log("Resultado do signIn:", result);

      if (result?.error) {
        console.error("Erro retornado pelo signIn:", result.error);
        if (result.error === "CredentialsSignin" || result.error.includes("incorreta") || result.error.includes("encontrado")) {
            setError("Email ou senha inválidos.");
        } else {
            setError(result.error);
        }
      } else if (result?.ok && !result?.error) {
         console.log("signIn OK! Redirecionando para /dashboard via window.location...");
         // --- [CORREÇÃO AQUI] ---
         // Usa window.location.assign para forçar o redirecionamento
         window.location.assign("/dashboard");
         // --- [FIM CORREÇÃO] ---
         // Não deve chegar aqui, mas por segurança
         return;
      } else {
        console.error("Resultado inesperado do signIn:", result);
        setError("Ocorreu um erro desconhecido durante o login.");
      }
    } catch (err) {
      console.error("Erro geral no handleSubmit:", err);
      setError("Falha ao tentar fazer login.");
    } finally {
      // Importante: Não definir setIsLoading(false) imediatamente se o redirecionamento
      // for iniciado, pois a página vai recarregar.
      // Apenas definimos se houve erro.
      if (error) { // Se error foi definido no catch ou if(result?.error)
         setIsLoading(false);
      }
      // Se result foi ok, o redirecionamento já foi iniciado
    }
  };

  const handleOAuthSignIn = (provider: 'google' | 'twitch') => {
    setIsLoading(provider);
    signIn(provider, { callbackUrl });
   };

  // --- O JSX do return permanece o mesmo ---
  return (
    <Card className="w-full max-w-md">
       {/* ... (Resto do JSX igual) ... */}
       <CardHeader className="text-center"> <CardTitle className="text-3xl font-bold">Login</CardTitle> <CardDescription>Acesse sua conta MeuCronograma</CardDescription> </CardHeader> <CardContent className="space-y-4"> <div className="space-y-3 pt-4"> <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('google')} disabled={!!isLoading} > <FcGoogle className="h-5 w-5 mr-2" /> {isLoading === 'google' ? "Aguarde..." : "Entrar com Google"} </Button> <Button variant="outline" className="w-full bg-[#6441a5] text-white hover:bg-[#583894]" onClick={() => handleOAuthSignIn('twitch')} disabled={!!isLoading} > <FaTwitch className="h-5 w-5 mr-2" /> {isLoading === 'twitch' ? "Aguarde..." : "Entrar com Twitch"} </Button> </div> <div className="relative my-4"> <div className="absolute inset-0 flex items-center"> <Separator /> </div> <div className="relative flex justify-center text-xs uppercase"> <span className="bg-card px-2 text-muted-foreground">Ou continue com</span> </div> </div> <form onSubmit={handleSubmit} className="space-y-4"> <div className="space-y-1"> <Label htmlFor="email">Email</Label> <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!!isLoading}/> </div> <div className="space-y-1"> <Label htmlFor="password">Senha</Label> <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={!!isLoading}/> </div> {error && <p className="text-sm text-red-600">{error}</p>} <Button type="submit" disabled={!!isLoading} className="w-full"> {isLoading === 'credentials' ? "A entrar..." : "Entrar"} </Button> </form> </CardContent> <CardFooter className="text-sm text-center block"> Não tem conta?{" "} <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500"> Registe-se </Link> </CardFooter>
    </Card>
  );
}

// Componente da Página Principal (igual)
export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 px-4">
       <Suspense fallback={<div className="text-center p-10">A carregar formulário...</div>}>
          <SignInForm />
       </Suspense>
    </div>
  );
}

