"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; 

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CREATOR" | "VISITOR">("VISITOR"); 
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setIsLoading(true);
    if (!name || !username || !email || !password || !role) { setError("Todos os campos são obrigatórios."); setIsLoading(false); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError("Username inválido (letras, números, _)."); setIsLoading(false); return; }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json", },
        body: JSON.stringify({ name, username, email, password, role }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Falha ao registrar"); }

      const signInResponse = await signIn("credentials", { redirect: false, email, password, });
      if (signInResponse?.error) { setError(`Registro OK, login falhou: ${signInResponse.error}. Faça login.`); setTimeout(() => router.push('/auth/signin'), 3000); }
      else { router.push("/dashboard"); } 
    } catch (err: any) { setError(err.message);
    } finally { setIsLoading(false); }
  };

  return (
    // [CORREÇÃO] Remove 'bg-slate-100'
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
         <CardHeader className="text-center">
         {/* CardTitle usa text-foreground por padrão */}
         <CardTitle className="text-3xl font-bold">Criar Conta</CardTitle>
         {/* [CORREÇÃO] Adiciona cor semântica */}
         <CardDescription className="text-muted-foreground">Junte-se ao MeuCronograma</CardDescription>
         </CardHeader>
         <CardContent>
           <form onSubmit={handleSubmit} className="space-y-4">
             {/* Campos Name, Username, Email, Password */}
             <div className="space-y-1"> 
               {/* [CORREÇÃO] Adiciona cor semântica */}
               <Label htmlFor="name" className="text-muted-foreground">Nome</Label> 
               <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} className="placeholder:text-muted-foreground"/> 
             </div>
             <div className="space-y-1"> 
               {/* [CORREÇÃO] Adiciona cor semântica */}
               <Label htmlFor="username" className="text-muted-foreground">Username</Label> 
               <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required pattern="^[a-zA-Z0-9_]+$" title="Apenas letras, números e underscores (_)" disabled={isLoading} className="placeholder:text-muted-foreground"/> 
               {/* [CORREÇÃO] Adiciona cor semântica */}
               <p className="text-xs text-muted-foreground">Será o seu URL público (ex: site.com/{username})</p> 
             </div>
             <div className="space-y-1"> 
               {/* [CORREÇÃO] Adiciona cor semântica */}
               <Label htmlFor="email" className="text-muted-foreground">Email</Label> 
               <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className="placeholder:text-muted-foreground"/> 
             </div>
             <div className="space-y-1"> 
               {/* [CORREÇÃO] Adiciona cor semântica */}
               <Label htmlFor="password" className="text-muted-foreground">Senha</Label> 
               <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} className="placeholder:text-muted-foreground"/> 
             </div>

             {/* Seleção de Role */}
             <div className="space-y-2 pt-2">
                 {/* [CORREÇÃO] Adiciona cor semântica */}
                 <Label className="text-muted-foreground">Qual o seu objetivo?</Label>
                 {/* RadioGroup e Labels internas usam Shadcn, devem estar OK */}
                 <RadioGroup value={role} onValueChange={(value: "CREATOR" | "VISITOR") => setRole(value)} disabled={isLoading}>
                   <div className="flex items-center space-x-2">
                       <RadioGroupItem value="CREATOR" id="role-creator" />
                       <Label htmlFor="role-creator" className="font-normal text-foreground"> {/* Garante cor correta */}
                         Criar e gerir os meus cronogramas (Acesso ao Dashboard)
                       </Label>
                   </div>
                   <div className="flex items-center space-x-2">
                       <RadioGroupItem value="VISITOR" id="role-visitor" />
                       <Label htmlFor="role-visitor" className="font-normal text-foreground"> {/* Garante cor correta */}
                         Apenas visitar e ver cronogramas públicos
                       </Label>
                   </div>
                 </RadioGroup>
             </div>
             
             {error && <p className="text-sm text-red-600">{error}</p>}

             <Button type="submit" disabled={isLoading} className="w-full">
               {isLoading ? "A registrar..." : "Registrar"}
             </Button>
           </form>
         </CardContent>
          {/* [CORREÇÃO] Adiciona cor semântica ao texto e ao link */}
          <CardFooter className="text-sm text-center block text-muted-foreground">
           Já tem conta?{" "} 
           <Link href="/auth/signin" className="font-medium text-primary hover:underline"> {/* Usa text-primary e hover:underline */}
             Faça login 
           </Link>
         </CardFooter>
       </Card>
    </div>
  );
}