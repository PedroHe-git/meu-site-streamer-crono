import prisma from '@/lib/prisma';
import { notFound } from "next/navigation";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { ScheduleItem, Media, MediaStatus, Prisma } from '@prisma/client';
import Image from "next/image";
import UserListsClient from '@/app/components/UserListsClient';
import { FiRefreshCw } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link'; // Importa Link

// Tipagem
type ScheduleItemWithMedia = ScheduleItem & { media: Media; };
type MediaStatusWithMedia = MediaStatus & { media: Media; };
type DaySchedule = { date: Date; dayName: string; items: ScheduleItemWithMedia[]; };
type InitialListData = { items: MediaStatusWithMedia[]; totalCount: number; };

// Define a constante fora da função para evitar recriação
const PAGE_SIZE_PUBLIC = 20;

export default async function PublicProfilePage({ params, searchParams }: { params: { username: string }, searchParams: { [key: string]: string | string[] | undefined } }) {

  const { username } = params;
  const decodedUsername = decodeURIComponent(username);

  // Lógica da Semana
  const weekOffset = Number(searchParams.weekOffset) || 0;
  const today = new Date();
  const targetDate = addDays(today, weekOffset * 7);
  const weekOptions = { locale: ptBR, weekStartsOn: 1 as 0 | 1 | 2 | 3 | 4 | 5 | 6 };
  const startOfThisWeek = startOfDay(startOfWeek(targetDate, weekOptions));
  const endOfThisWeek = endOfDay(endOfWeek(targetDate, weekOptions));

  // Busca User
  const user = await prisma.user.findUnique({
      where: { username: decodedUsername },
      select: { id: true, name: true, username: true } // Seleciona apenas o necessário
  });
  if (!user) { notFound(); }

  // Busca Schedule da Semana
  const scheduleItemsDb = await prisma.scheduleItem.findMany({
      where: { userId: user.id, scheduledAt: { gte: startOfThisWeek, lte: endOfThisWeek } },
      include: { media: true },
      orderBy: [{ scheduledAt: 'asc' }, { horario: 'asc' }],
  });
  const scheduleItems = scheduleItemsDb as ScheduleItemWithMedia[];

  // Função Auxiliar para buscar a primeira página das listas
  const fetchInitialList = async (status: Prisma.EnumMovieStatusTypeFilter['equals']): Promise<InitialListData> => {
    const whereCondition: Prisma.MediaStatusWhereInput = { userId: user.id, status: status };
    const [items, totalCount] = await Promise.all([
      prisma.mediaStatus.findMany({
        where: whereCondition,
        include: { media: true },
        take: PAGE_SIZE_PUBLIC, // Usa a constante
        orderBy: { media: { title: 'asc' } }
      }),
      prisma.mediaStatus.count({ where: whereCondition })
    ]);
    return { items: items as MediaStatusWithMedia[], totalCount };
  };

  // Busca a primeira página de cada lista
  const [initialToWatch, initialWatching, initialWatched, initialDropped] = await Promise.all([
    fetchInitialList("TO_WATCH"),
    fetchInitialList("WATCHING"),
    fetchInitialList("WATCHED"),
    fetchInitialList("DROPPED")
  ]);

  // Agrupa Agendamentos por Dia
  const daysOfWeek: DaySchedule[] = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(startOfThisWeek, i);
    const itemsForThisDay = scheduleItems.filter(item => isSameDay(item.scheduledAt, day));
    daysOfWeek.push({
      date: day,
      dayName: format(day, "EEEE", { locale: ptBR }),
      items: itemsForThisDay,
    });
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-16">

      {/* Cabeçalho */}
       <div className="text-center mb-12">
         <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
           {user.name || user.username}
         </h1>
         <p className="text-lg text-muted-foreground">
           Acompanhe minha programação!
         </p>
       </div>

      {/* Card Cronograma */}
       <Card className="mb-12">
         <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl md:text-3xl">Cronograma da Semana</CardTitle>
              <div className="flex gap-2">
                {/* Botões com Link interno */}
                <Button variant="outline" size="sm" asChild>
                   <Link href={`/${username}?weekOffset=${weekOffset - 1}`}>&larr; Anterior</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                   <Link href={`/${username}?weekOffset=${weekOffset + 1}`}>Próxima &rarr;</Link>
                </Button>
              </div>
            </div>
         </CardHeader>
         <CardContent className="space-y-6">
           {daysOfWeek.map(day => (
             <div key={day.date.toString()}>
               <h3 className="text-lg font-semibold text-primary mb-3 capitalize">
                 {day.dayName}
                 <span className="text-base text-muted-foreground font-normal ml-2">({format(day.date, "dd/MM")})</span>
               </h3>
               {day.items.length === 0 ? (
                 <p className="text-muted-foreground text-sm pl-4">Nenhum item agendado.</p>
               ) : (
                 <ul className="space-y-3 pl-4 border-l-2">
                   {day.items.map(item => {
                      // Tenta encontrar o status para verificar se é semanal (melhor aproximação no server component)
                      const isItemWeekly = initialWatching.items.find(ms => ms.mediaId === item.mediaId)?.isWeekly ?? false;
                      return !item.media ? null : (
                       <li key={item.id} className="flex items-start gap-4">
                         <Image
                           src={ item.media.posterPath || "/poster-placeholder.png" }
                           width={50} height={75} alt={item.media.title}
                           className="rounded shadow-sm flex-shrink-0"
                           unoptimized={true}
                           priority={daysOfWeek.findIndex(d => d.date === day.date) < 2 && day.items.indexOf(item) < 3} // Prioriza os primeiros itens dos primeiros dias
                         />
                         <div className="flex-grow">
                           <span className="font-semibold text-lg text-foreground line-clamp-2 flex items-center gap-1" title={item.media.title}>
                             {item.media.title}
                             {isItemWeekly && (<FiRefreshCw className="inline text-blue-500 flex-shrink-0" title="Item Semanal"/>)}
                           </span>
                           {item.seasonNumber && (
                              <div className="text-xs text-muted-foreground font-medium mt-0.5">
                                <span>T{item.seasonNumber}</span>
                                {item.episodeNumber && ( <span>, E{item.episodeNumber}{item.episodeNumberEnd && item.episodeNumberEnd > item.episodeNumber ? ` - ${item.episodeNumberEnd}` : ''}</span> )}
                              </div>
                            )}
                         </div>
                         {item.horario && (
                           <div className="flex-shrink-0 text-right">
                             <span className="text-sm font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                               {item.horario}
                             </span>
                           </div>
                          )}
                       </li>
                      );
                   })}
                 </ul>
               )}
             </div>
           ))}
         </CardContent>
       </Card>


      {/* Listas (Passa para o Client Component) */}
      <UserListsClient
        username={decodedUsername}
        initialToWatch={initialToWatch}
        initialWatching={initialWatching}
        initialWatched={initialWatched}
        initialDropped={initialDropped}
      />

    </div>
  );
}

