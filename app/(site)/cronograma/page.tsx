import { prisma } from "@/lib/prisma";
import ScheduleSlider from "@/app/components/ScheduleSlider";
import { Metadata } from "next";
import { startOfWeek, subWeeks } from "date-fns"; // Adicione esta importação

export const revalidate = 60; 

export const metadata: Metadata = {
  title: "Cronograma | MahMoojen",
  description: "Confira os horários das próximas lives e o que vamos assistir.",
};

async function getSchedule() {
  const today = new Date();

  // [CORREÇÃO]: Define o início da busca para o começo da semana atual (Segunda-feira)
  // Isso garante que se hoje for Quarta, os itens de Seg/Ter ainda apareçam na grade.
  const startDate = startOfWeek(today, { weekStartsOn: 1 }); // 1 = Segunda-feira
  
  // (Opcional) Se quiser que o botão "Semana Anterior" funcione por 1 semana,
  // você pode usar: const startDate = subWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1);

  const rawItems = await prisma.scheduleItem.findMany({
    where: {
      scheduledAt: {
        gte: startDate, // Busca do início da semana em diante
      },
      // user: { role: "CREATOR" } // Pode manter comentado se for site de usuário único
    },
    include: {
      media: true,
      user: true,
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  return JSON.parse(JSON.stringify(rawItems));
}

export default async function CronogramaPage() {
  const scheduleItems = await getSchedule();

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

        {/* Verifica se há itens OU se estamos visualizando a semana atual vazia */}
        <ScheduleSlider items={scheduleItems} />
      </div>
    </main>
  );
}