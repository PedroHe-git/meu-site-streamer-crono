"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// --- [NOVO] Importa RadioGroup do Shadcn ---
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Adicione com `npx shadcn-ui@latest add radio-group`
// --- [FIM NOVO] ---

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // --- [NOVO] Estado para a role ---
  const [role, setRole] = useState<"CREATOR" | "VISITOR">("VISITOR"); // Começa como VISITOR
  // --- [FIM NOVO] ---
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setIsLoading(true);
    // Validações básicas (iguais)
    if (!name || !username || !email || !password || !role) { setError("Todos os campos são obrigatórios."); setIsLoading(false); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError("Username inválido (letras, números, _)."); setIsLoading(false); return; }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json", },
        // --- [NOVO] Envia 'role' para a API ---
        body: JSON.stringify({ name, username, email, password, role }),
        // --- [FIM NOVO] ---
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Falha ao registar"); }

      // Login automático (igual)
      const signInResponse = await signIn("credentials", { redirect: false, email, password, });
      if (signInResponse?.error) { setError(`Registo OK, login falhou: ${signInResponse.error}. Faça login.`); setTimeout(() => router.push('/auth/signin'), 3000); }
      else { router.push("/dashboard"); } // Envia para o dashboard após registo/login
    } catch (err: any) { setError(err.message);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 px-4">
      <Card className="w-full max-w-md">
         <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Criar Conta</CardTitle>
          <CardDescription>Junte-se ao MeuCronograma</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campos Name, Username, Email, Password (iguais) */}
            <div className="space-y-1"> <Label htmlFor="name">Nome</Label> <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading}/> </div>
            <div className="space-y-1"> <Label htmlFor="username">Username</Label> <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required pattern="^[a-zA-Z0-9_]+$" title="Apenas letras, números e underscores (_)" disabled={isLoading}/> <p className="text-xs text-muted-foreground">Será o seu URL público (ex: site.com/{username})</p> </div>
            <div className="space-y-1"> <Label htmlFor="email">Email</Label> <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading}/> </div>
            <div className="space-y-1"> <Label htmlFor="password">Senha</Label> <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading}/> </div>

            {/* --- [NOVO] Seleção de Role --- */}
            <div className="space-y-2 pt-2">
               <Label>Qual o seu objetivo?</Label>
               <RadioGroup value={role} onValueChange={(value: "CREATOR" | "VISITOR") => setRole(value)} disabled={isLoading}>
                  <div className="flex items-center space-x-2">
                     <RadioGroupItem value="CREATOR" id="role-creator" />
                     <Label htmlFor="role-creator" className="font-normal">Criar e gerir os meus cronogramas (Acesso ao Dashboard)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                     <RadioGroupItem value="VISITOR" id="role-visitor" />
                     <Label htmlFor="role-visitor" className="font-normal">Apenas visitar e ver cronogramas públicos</Label>
                  </div>
               </RadioGroup>
            </div>
            {/* --- [FIM NOVO] --- */}


            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "A registar..." : "Registar"}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-sm text-center block">
          Já tem conta?{" "} <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500"> Faça login </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

