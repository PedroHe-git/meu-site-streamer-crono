// app/(site)/cronograma/page.tsx
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import ScheduleSlider from '@/app/components/ScheduleSlider';
import { startOfWeek } from 'date-fns'; // Importe isso

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Cronograma | Agenda Semanal',
  description: 'Confira a programação completa de lives e jogos da semana.',
};

async function getSchedule() {
  const today = new Date();
  
  // 👇 MUDANÇA: Pega a Segunda-feira desta semana (para mostrar a semana completa)
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  
  // Pega até 4 semanas pra frente (para o slider ter conteúdo futuro)
  const futureDate = new Date(startOfCurrentWeek);
  futureDate.setDate(startOfCurrentWeek.getDate() + 28);

  const events = await prisma.scheduleItem.findMany({
    where: {
      scheduledAt: {
        gte: startOfCurrentWeek, // Busca desde a segunda-feira
        lte: futureDate 
      },
      user: {
        role: UserRole.CREATOR
      }
    },
    orderBy: {
      scheduledAt: 'asc',
    },
    include: {
      media: {
        select: {
          title: true,
          posterPath: true,
          mediaType: true
        }
      },
      user: {
        select: {
          name: true,
          image: true,
          twitchUsername: true
        }
      }
    },
  });

  return events;
}

export default async function CronogramaPage() {
  const schedule = await getSchedule();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="bg-gradient-to-b from-gray-900 to-gray-950 py-12 border-b border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Agenda Semanal
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Acompanhe a nossa programação de Segunda a Domingo.
          </p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Passamos uma cópia limpa do objeto para evitar erro de Data do Server Component */}
        <ScheduleSlider events={JSON.parse(JSON.stringify(schedule))} />
      </main>
    </div>
  );
}