"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [data, setData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setError("E-mail ou senha incorretos.");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Erro ao conectar. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4 relative overflow-hidden">
      
      {/* Background Lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-4">
            M
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Bem-vindo de volta
          </h2>
          <p className="mt-2 text-gray-400">
            Acesse o painel do criador
          </p>
        </div>

        <div className="bg-gray-900/40 border border-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@exemplo.com"
                  className="pl-10 bg-black/40 border-gray-800 text-white focus:border-purple-500 h-12"
                  value={data.email}
                  onChange={(e) => setData({...data, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-black/40 border-gray-800 text-white focus:border-purple-500 h-12"
                  value={data.password}
                  onChange={(e) => setData({...data, password: e.target.value})}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Entrar"}
            </Button>
          </form>
        </div>

        <div className="text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors">
                ← Voltar para o site
            </Link>
        </div>
      </div>
    </div>
  );
}