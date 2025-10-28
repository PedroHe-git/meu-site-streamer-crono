"use client";

// --- [NOVO] Importa Suspense ---
import React, { useState, Suspense } from "react"; 
// --- [FIM NOVO] ---
import { signIn } from "next-auth/react"; // Import v4
import { useRouter, useSearchParams } from "next/navigation"; // Importa useSearchParams de navigation
import Link from "next/link";
import { FcGoogle } from 'react-icons/fc';
import { FaTwitch } from 'react-icons/fa';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// --- [NOVO] Componente Interno que usa os hooks ---
function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook usado aqui
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState<boolean | 'google' | 'twitch' | 'credentials'>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setIsLoading('credentials');
    try {
      const result = await signIn("credentials", { redirect: false, email, password });
      if (result?.error) setError(result.error);
      else if (result?.ok) router.push(callbackUrl);
      else setError("Erro desconhecido durante o login.");
    } catch (err) { setError("Falha ao tentar fazer login."); console.error("Erro no signIn:", err);
    } finally { setIsLoading(false); }
  };

  const handleOAuthSignIn = (provider: 'google' | 'twitch') => {
    setIsLoading(provider);
    signIn(provider, { callbackUrl });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Login</CardTitle>
        <CardDescription>Acesse sua conta MeuCronograma</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botões OAuth */}
        <div className="space-y-3 pt-4">
           <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('google')} disabled={!!isLoading} >
              <FcGoogle className="h-5 w-5 mr-2" /> {isLoading === 'google' ? "Aguarde..." : "Entrar com Google"}
           </Button>
           <Button variant="outline" className="w-full bg-[#6441a5] text-white hover:bg-[#583894]" onClick={() => handleOAuthSignIn('twitch')} disabled={!!isLoading} >
              <FaTwitch className="h-5 w-5 mr-2" /> {isLoading === 'twitch' ? "Aguarde..." : "Entrar com Twitch"}
          </Button>
        </div>
        {/* Separador */}
         <div className="relative my-4"> <div className="absolute inset-0 flex items-center"> <Separator /> </div> <div className="relative flex justify-center text-xs uppercase"> <span className="bg-card px-2 text-muted-foreground">Ou continue com</span> </div> </div>
        {/* Formulário Credentials */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!!isLoading}/>
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={!!isLoading}/>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={!!isLoading} className="w-full">
            {isLoading === 'credentials' ? "A entrar..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-center block">
        Não tem conta?{" "} <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500"> Registe-se </Link>
      </CardFooter>
    </Card>
  );
}
// --- [FIM NOVO Componente Interno] ---


// --- Componente da Página Principal ---
export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 px-4">
       {/* --- [NOVO] Envolve o formulário com Suspense --- */}
       <Suspense fallback={<div>A carregar...</div>}> {/* Pode usar um spinner aqui */}
          <SignInForm />
       </Suspense>
       {/* --- [FIM NOVO] --- */}
    </div>
  );
}

