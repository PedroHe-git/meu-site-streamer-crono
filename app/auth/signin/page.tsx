"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from 'react-icons/fc';
import { FaTwitch } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Export dinâmico mantido
export const dynamic = 'force-dynamic';

function SignInForm() {
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
        redirect: false, 
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
        setIsLoading(false); // Define loading como false APENAS se houver erro
      } else if (result?.ok && !result?.error) {
         console.log("signIn OK! Redirecionando para /dashboard via window.location...");
         window.location.assign("/dashboard"); // Força redirecionamento
         // Não deve chegar aqui, mas mantém o return
         return;
      } else {
        console.error("Resultado inesperado do signIn:", result);
        setError("Ocorreu um erro desconhecido durante o login.");
        setIsLoading(false); // Define loading como false em erro inesperado
      }
    } catch (err) {
      console.error("Erro geral no handleSubmit:", err);
      setError("Falha ao tentar fazer login.");
      setIsLoading(false); // Define loading como false em erro geral
    } 
    // Removido o finally que limpava o isLoading incondicionalmente
  };

  const handleOAuthSignIn = (provider: 'google' | 'twitch') => {
    setIsLoading(provider);
    signIn(provider, { callbackUrl });
   };

  return (
    // Card já usa cores semânticas, está OK
    <Card className="w-full max-w-md">
       <CardHeader className="text-center"> 
         <CardTitle className="text-3xl font-bold">Login</CardTitle> 
         {/* [CORREÇÃO] Adiciona cor semântica */}
         <CardDescription className="text-muted-foreground">Acesse sua conta MeuCronograma</CardDescription> 
       </CardHeader> 
       <CardContent className="space-y-4"> 
         {/* Botões OAuth (Button 'outline' e cores custom do Twitch já devem funcionar bem) */}
         <div className="space-y-3 pt-4"> 
           <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('google')} disabled={!!isLoading} > 
             <FcGoogle className="h-5 w-5 mr-2" /> 
             {isLoading === 'google' ? "Aguarde..." : "Entrar com Google"} 
           </Button> 
           <Button variant="outline" className="w-full bg-[#6441a5] text-white hover:bg-[#583894]" onClick={() => handleOAuthSignIn('twitch')} disabled={!!isLoading} > 
             <FaTwitch className="h-5 w-5 mr-2" /> 
             {isLoading === 'twitch' ? "Aguarde..." : "Entrar com Twitch"} 
           </Button> 
         </div> 
         
         {/* Separador (Corrigido) */}
         <div className="relative my-4"> 
           <div className="absolute inset-0 flex items-center"> 
             <Separator /> {/* Separator usa cores semânticas */}
           </div> 
           <div className="relative flex justify-center text-xs uppercase"> 
             {/* [CORREÇÃO] Usa bg-card para o span se misturar */}
             <span className="bg-card px-2 text-muted-foreground">Ou continue com</span> 
           </div> 
         </div> 
         
         {/* Formulário de Credentials */}
         <form onSubmit={handleSubmit} className="space-y-4"> 
           <div className="space-y-1"> 
             {/* [CORREÇÃO] Adiciona cor à Label */}
             <Label htmlFor="email" className="text-muted-foreground">Email</Label> 
             {/* [CORREÇÃO] Adiciona cor ao Placeholder (boa prática) */}
             <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!!isLoading} className="placeholder:text-muted-foreground"/> 
           </div> 
           <div className="space-y-1"> 
             {/* [CORREÇÃO] Adiciona cor à Label */}
             <Label htmlFor="password" className="text-muted-foreground">Senha</Label> 
             {/* [CORREÇÃO] Adiciona cor ao Placeholder (boa prática) */}
             <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={!!isLoading} className="placeholder:text-muted-foreground"/> 
           </div> 
           {error && <p className="text-sm text-red-600">{error}</p>} 
           <Button type="submit" disabled={!!isLoading} className="w-full"> 
             {isLoading === 'credentials' ? "A entrar..." : "Entrar"} 
           </Button> 
         </form> 
       </CardContent> 
       
       {/* Footer (Corrigido) */}
       {/* [CORREÇÃO] Adiciona cor semântica ao texto e ao link */}
       <CardFooter className="text-sm text-center block text-muted-foreground"> 
         Não tem conta?{" "} 
         <Link href="/auth/register" className="font-medium text-primary hover:underline"> 
           Registre-se 
         </Link> 
       </CardFooter>
    </Card>
  );
}

// Componente da Página Principal (Corrigido)
export default function SignInPage() {
  return (
    // [CORREÇÃO] Remove 'bg-slate-100'
    <div className="flex items-center justify-center min-h-screen px-4">
        <Suspense fallback={<div className="text-center p-10 text-muted-foreground">A carregar formulário...</div>}>
          <SignInForm />
        </Suspense>
    </div>
  );
}