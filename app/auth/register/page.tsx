"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Importa componentes Shadcn ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// --- FIM ---


export default function RegisterPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setIsLoading(true);
    if (!name || !username || !email || !password) { setError("Todos os campos são obrigatórios."); setIsLoading(false); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError("Username inválido (letras, números, _)."); setIsLoading(false); return; }

    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify({ name, username, email, password, }), });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Falha ao registar"); }

      // Login automático após registo
      const signInResponse = await signIn("credentials", { redirect: false, email, password, });
      if (signInResponse?.error) { setError(`Registo OK, login falhou: ${signInResponse.error}. Faça login.`); setTimeout(() => router.push('/auth/signin'), 3000); }
      else { router.push("/dashboard"); }
    } catch (err: any) { setError(err.message);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 px-4">
      {/* --- Usa Shadcn Card --- */}
      <Card className="w-full max-w-md">
         <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Criar Conta</CardTitle>
          <CardDescription>Junte-se ao MeuCronograma</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading}/>
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required pattern="^[a-zA-Z0-9_]+$" title="Apenas letras, números e underscores (_)" disabled={isLoading}/>
              <p className="text-xs text-muted-foreground">Será o seu URL público (ex: site.com/{username})</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading}/>
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading}/>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "A registar..." : "Registar"}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-sm text-center block">
          Já tem conta?{" "}
          <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
            Faça login
          </Link>
        </CardFooter>
      </Card>
      {/* --- FIM Card --- */}
    </div>
  );
}

