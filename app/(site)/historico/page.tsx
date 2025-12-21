// app/(site)/historico/page.tsx
import { Header } from "@/app/components/portfolio/Header";
import { Footer } from "@/app/components/portfolio/Footer";
import { VideoCarousel } from "@/app/components/portfolio/VideoCarousel";

export default function HistoricoPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <section className="flex-grow pt-28 pb-16 container mx-auto px-4">
         <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Últimos Vídeos & Histórico</h1>
          <p className="text-muted-foreground">O que rolou nas últimas transmissões e gameplays.</p>
        </div>
        <VideoCarousel />
      </section>
      <Footer />
    </main>
  );
}