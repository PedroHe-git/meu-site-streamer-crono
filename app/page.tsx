import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Usa import centralizado
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Importa Button do Shadcn
import { redirect } from "next/navigation"; // Para redirecionar se já logado

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // Se o utilizador já estiver logado, redireciona para o dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-center p-8">
      <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6">
        Bem-vindo ao MeuCronograma!
      </h1>
      <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl">
        Organize facilmente os filmes, séries e animes que você quer assistir. Crie listas, agende sessões e nunca mais perca o fio da meada.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg">
          <Link href="/auth/signin">Entrar</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/register">Criar Conta</Link>
        </Button>
      </div>
       {/* (Opcional) Adicionar uma imagem ou ícone ilustrativo */}
       {/* <div className="mt-12">
          <Image src="/placeholder.svg" width={300} height={200} alt="Ilustração Cronograma" />
       </div> */}
    </div>
  );
}

