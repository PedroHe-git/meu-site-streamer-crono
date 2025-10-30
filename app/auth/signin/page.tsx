"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from 'react-icons/fc';
import { FaTwitch, FaRegBookmark } from 'react-icons/fa'; // Importa um ícone
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const dynamic = 'force-dynamic';

// --- O COMPONENTE SignInForm (com a lógica) PERMANECE O MESMO ---
// (Ele já está com as cores semânticas corretas)
function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState<boolean | 'google' | 'twitch' | 'credentials'>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError(""); 
    setIsLoading('credentials'); // 1. Inicia o loading
    
    try {
      const result = await signIn("credentials", {
        redirect: false, 
        email,
        password,
      });

      if (result?.error) {
        // --- CAMINHO DE ERRO 1 ---
        if (result.error === "CredentialsSignin" || result.error.includes("incorreta") || result.error.includes("encontrado")) {
            setError("Email ou senha inválidos.");
        } else {
            setError(result.error);
        }
        setIsLoading(false); // 2. PARA O LOADING AQUI

      } else if (result?.ok && !result?.error) {
        // --- CAMINHO DE SUCESSO ---
         window.location.assign("/dashboard"); // Redireciona
         return; // Para a execução
      
      } else {
        // --- CAMINHO DE ERRO 2 ---
        setError("Ocorreu um erro desconhecido durante o login.");
        setIsLoading(false); // 3. PARA O LOADING AQUI
      }
    } catch (err) {
      // --- CAMINHO DE ERRO 3 ---
      setError("Falha ao tentar fazer login.");
      setIsLoading(false); // 4. PARA O LOADING AQUI
    } 
    // O 'finally' foi removido
  };

  const handleOAuthSignIn = (provider: 'google' | 'twitch') => {
    setIsLoading(provider);
    signIn(provider, { callbackUrl });
   };

  return (
    <Card className="w-full max-w-md">
       <CardHeader className="text-center"> 
         <CardTitle className="text-3xl font-bold">Login</CardTitle> 
         <CardDescription className="text-muted-foreground">Acesse sua conta MeuCronograma</CardDescription> 
       </CardHeader> 
       <CardContent className="space-y-4"> 
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
         
         <div className="relative my-4"> 
           <div className="absolute inset-0 flex items-center"> 
             <Separator />
           </div> 
           <div className="relative flex justify-center text-xs uppercase"> 
             <span className="bg-card px-2 text-muted-foreground">Ou continue com</span> 
           </div> 
         </div> 
         
         <form onSubmit={handleSubmit} className="space-y-4"> 
           <div className="space-y-1"> 
             <Label htmlFor="email" className="text-muted-foreground">Email</Label> 
             <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!!isLoading} className="placeholder:text-muted-foreground"/> 
           </div> 
           <div className="space-y-1"> 
             <Label htmlFor="password" className="text-muted-foreground">Senha</Label> 
             <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={!!isLoading} className="placeholder:text-muted-foreground"/> 
           </div> 
           {error && <p className="text-sm text-red-600">{error}</p>} 
           <Button type="submit" disabled={!!isLoading} className="w-full"> 
             {isLoading === 'credentials' ? "A entrar..." : "Entrar"} 
           </Button> 
         </form> 
       </CardContent> 
       
       <CardFooter className="text-sm text-center block text-muted-foreground"> 
         Não tem conta?{" "} 
         <Link href="/auth/register" className="font-medium text-primary hover:underline"> 
           Registe-se 
         </Link> 
       </CardFooter>
    </Card>
  );
}


// --- [MUDANÇA NO LAYOUT DA PÁGINA AQUI] ---
export default function SignInPage() {
  return (
    // 1. Usa 'grid' no desktop e 'flex' no mobile (padrão)
    <div className="flex items-center justify-center lg:grid lg:grid-cols-2 min-h-screen">

      {/* 2. Coluna da Esquerda (Formulário) */}
      {/* Sempre visível. No desktop, ocupa a primeira coluna. */}
      <div className="flex items-center justify-center p-8 w-full">
        {/* Suspense é necessário porque SignInForm usa 'useSearchParams' */}
        <Suspense fallback={<div className="text-center p-10 text-muted-foreground">A carregar...</div>}>
          <SignInForm />
        </Suspense>
      </div>

      {/* 3. Coluna da Direita (Branding/Visual) */}
      {/* 'hidden lg:flex' -> Escondida no mobile, visível (flex) no desktop */}
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