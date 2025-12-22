import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import ScheduleSlider from '@/app/components/ScheduleSlider';
import { startOfWeek } from 'date-fns'; 

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Cronograma | Agenda Semanal',
  description: 'Confira a programação completa de lives e jogos.',
};

async function getSchedule() {
  const today = new Date();
  
  // Pega o início desta semana para garantir que o carrossel comece certo
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  
  // 👇 MUDANÇA: Buscamos 60 dias para frente (aprox. 8 semanas)
  // Isso evita que o carrossel fique vazio ao clicar em "Próxima Semana"
  const futureDate = new Date(startOfCurrentWeek);
  futureDate.setDate(startOfCurrentWeek.getDate() + 60);

  const events = await prisma.scheduleItem.findMany({
    where: {
      scheduledAt: {
        gte: startOfCurrentWeek, 
        lte: futureDate 
      },
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
      <header className="bg-gradient-to-b from-gray-900 to-gray-950 pt-28 pb-12 border-b border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Agenda de Lives
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Saiba exatamente o que vamos assistir ou jogar hoje e nas próximas semanas.
          </p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <ScheduleSlider events={JSON.parse(JSON.stringify(schedule))} />
      </main>
    </div>
  );
}