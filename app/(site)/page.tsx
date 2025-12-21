import  Header  from "@/app/components/portfolio/Header";
import { Footer } from "@/app/components/portfolio/Footer";
import { TwitchPlayer } from "@/app/components/portfolio/TwitchPlayer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarDays, PlaySquare } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      
      {/* HERO: Ocupa a tela toda para destaque */}
      <section className="flex-grow flex flex-col pt-24 pb-10 bg-gradient-to-b from-slate-900 to-background">
         <div className="container mx-auto px-4 flex-grow flex flex-col justify-center">
            <TwitchPlayer />
            
            {/* Atalhos rápidos embaixo do player */}
            <div className="flex justify-center gap-4 mt-8">
               <Button size="lg" asChild className="gap-2">
                 <Link href="/cronograma">
                   <CalendarDays className="w-5 h-5"/> Ver Programação
                 </Link>
               </Button>
               <Button size="lg" variant="outline" asChild className="gap-2">
                 <Link href="/historico">
                   <PlaySquare className="w-5 h-5"/> Últimos Vídeos
                 </Link>
               </Button>
            </div>
         </div>
      </section>

      <Footer />
    </main>
  );
}