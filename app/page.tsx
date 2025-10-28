import { getServerSession } from "next-auth/next";
// --- [IMPORT CORRETO v4] ---
// Importa do ficheiro da API route onde authOptions é definido na v4
import { authOptions } from "./api/auth/[...nextauth]/route";
// --- [FIM IMPORT] ---
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions); // Agora usa as opções corretas

  // Redireciona se já logado
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-center p-8">
      <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6">
        Bem-vindo ao MeuCronograma!
      </h1>
      <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl">
        Organize facilmente os filmes, séries e animes que você quer assistir. Crie listas, agende sessões e nunca mais perca o fio à meada.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg">
          <Link href="/auth/signin">Entrar</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/register">Criar Conta</Link>
        </Button>
      </div>
    </div>
  );
}

