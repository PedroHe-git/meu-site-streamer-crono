// app/(site)/cronograma/page.tsx
import { Header } from "@/app/components/portfolio/Header";
import { Footer } from "@/app/components/portfolio/Footer";
import { WeekCalendar } from "@/app/components/portfolio/WeekCalendar";

export default function CronogramaPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <section className="flex-grow pt-28 pb-16 container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Agenda da Semana</h1>
          <p className="text-muted-foreground">Não perca nenhuma live! Confira os horários abaixo.</p>
        </div>
        <WeekCalendar />
      </section>
      <Footer />
    </main>
  );
}