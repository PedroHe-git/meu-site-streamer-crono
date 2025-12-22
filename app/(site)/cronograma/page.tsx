import { prisma } from "@/lib/prisma";
import ScheduleSlider from "@/app/components/ScheduleSlider"; // Verifique se o caminho está correto
import { Metadata } from "next";

export const revalidate = 60; // Atualiza a cada 60 segundos

export const metadata: Metadata = {
  title: "Cronograma | MahMoojen",
  description: "Confira os horários das próximas lives e o que vamos assistir.",
};

async function getSchedule() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Zera o horário para pegar o dia todo

  // 1. Busca os dados no Banco
  const rawItems = await prisma.scheduleItem.findMany({
    where: {
      scheduledAt: {
        gte: today, // Apenas itens de hoje em diante
      },
      // REMOVIDO: user: { role: "CREATOR" } -> Agora pega de qualquer usuário (você)
    },
    include: {
      media: true,
      user: true,
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  // 2. TRUQUE DE SERIALIZAÇÃO:
  // Converte objetos Date para string para não quebrar o componente do Cliente.
  // Isso resolve o erro: "Only plain objects can be passed to Client Components"
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

        {scheduleItems.length > 0 ? (
          <ScheduleSlider items={scheduleItems} />
        ) : (
          <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-gray-800">
            <p className="text-gray-500 text-xl">
              Nenhum agendamento encontrado para os próximos dias.
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Fique de olho nas redes sociais para avisos de última hora!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}