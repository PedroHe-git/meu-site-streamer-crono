import { prisma } from "@/lib/prisma";
import ScheduleSlider from "@/app/components/ScheduleSlider";
import { Metadata } from "next";
import { startOfWeek } from "date-fns";
import { unstable_cache } from "next/cache"; // 👈 Importar o cache

// 1. Aumentamos o tempo de revalidação para 1 hora (3600 segundos)
export const revalidate = 3600; 

export const metadata: Metadata = {
  title: "Cronograma | MahMoojen",
  description: "Confira os horários das próximas lives e o que vamos assistir.",
};

// 2. Criar a função de busca COM CACHE
const getCachedSchedule = unstable_cache(
  async () => {
    const today = new Date();
    const startDate = startOfWeek(today, { weekStartsOn: 1 }); // Segunda-feira

    const rawItems = await prisma.scheduleItem.findMany({
      where: {
        scheduledAt: {
          gte: startDate,
        },
      },
      include: {
        media: true,
        user: true,
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });

    // É importante retornar dados planos para o cache
    return JSON.parse(JSON.stringify(rawItems));
  },
  ['public-schedule-list'], // Chave única
  {
    revalidate: 3600, // Revalida a cada 1 hora
    tags: ['schedule'] // Tag para limpar cache quando você editar no dashboard
  }
);

export default async function CronogramaPage() {
  // 3. Usa a função cacheada (não toca no banco se estiver no cache)
  const scheduleItems = await getCachedSchedule();

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-24 pb-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Cronograma de <span className="text-purple-500">Lives</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Fique por dentro do que vai rolar nas próximas transmissões.
          </p>
        </div>

        <ScheduleSlider items={scheduleItems} />
      </div>
    </main>
  );
}