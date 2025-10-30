import prisma from '@/lib/prisma';
import { notFound } from "next/navigation";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { ScheduleItem, Media, MediaStatus, Prisma, UserRole } from '@prisma/client';
import Image from "next/image";
import UserListsClient from '@/app/components/UserListsClient';
import { FiRefreshCw } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from 'next/link';
import { cn } from "@/lib/utils";
// Importa os componentes de Abas
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


// Tipagem
type ScheduleItemWithMedia = ScheduleItem & { media: Media; };
type MediaStatusWithMedia = MediaStatus & { media: Media; };
type DaySchedule = { date: Date; dayName: string; items: ScheduleItemWithMedia[]; };
type InitialListData = { items: MediaStatusWithMedia[]; totalCount: number; };

const PAGE_SIZE_PUBLIC = 20;

export default async function PublicProfilePage({ params, searchParams }: { params: { username: string }, searchParams: { [key: string]: string | string[] | undefined } }) {

  // --- LÓGICA DE BUSCA DE DADOS ---
  const { username } = params;
  const decodedUsername = decodeURIComponent(username);

  // Lógica da Semana (Com limite de -1 semana)
  const rawOffset = Number(searchParams.weekOffset) || 0;
  // [REGRA] Limita a navegação a no máximo 1 semana no passado (-1)
  const weekOffset = Math.max(-1, rawOffset); 
  
  const today = new Date();
  const targetDate = addDays(today, weekOffset * 7);
  const weekOptions = { locale: ptBR, weekStartsOn: 1 as const };
  const startOfThisWeek = startOfDay(startOfWeek(targetDate, weekOptions));
  const endOfThisWeek = endOfDay(endOfWeek(targetDate, weekOptions));

  // Busca User
  const user = await prisma.user.findUnique({
    where: { username: decodedUsername },
    select: {
        id: true, 
        name: true, 
        username: true, 
        role: true,
        bio: true,
      }
  });

  if (!user) { notFound(); }

  // Busca Schedule (Busca todos os itens, concluídos ou não)
  const scheduleItemsDb = await prisma.scheduleItem.findMany({
    where: { userId: user.id, scheduledAt: { gte: startOfThisWeek, lte: endOfThisWeek } },
    include: { media: true }, 
    orderBy: [{ scheduledAt: 'asc' }, { horario: 'asc' }],
  });
  // O tipo 'ScheduleItemWithMedia' agora inclui 'isCompleted'
  const scheduleItems = scheduleItemsDb as ScheduleItemWithMedia[];

  // Função fetchInitialList
  const fetchInitialList = async (status: 'TO_WATCH' | 'WATCHED'): Promise<InitialListData> => {
    const whereCondition: Prisma.MediaStatusWhereInput = { userId: user.id, status: status };
    const [items, totalCount] = await Promise.all([
      prisma.mediaStatus.findMany({
        where: whereCondition,
        include: { media: true },
        take: PAGE_SIZE_PUBLIC,
        orderBy: { media: { title: 'asc' } }
      }),
      prisma.mediaStatus.count({ where: whereCondition })
    ]);
    return { items: items as MediaStatusWithMedia[], totalCount };
  };

  // Busca Listas Iniciais
  const [initialToWatch, initialWatched] = await Promise.all([
    fetchInitialList("TO_WATCH"),
    fetchInitialList("WATCHED")
  ]);
  const initialWatching: InitialListData = { items: [], totalCount: 0 };
  const initialDropped: InitialListData = { items: [], totalCount: 0 };

  // Agrupa Agendamentos
  const daysOfWeek: DaySchedule[] = [];
  for (let i = 0; i < 7; i++) { const day = addDays(startOfThisWeek, i); const itemsForThisDay = scheduleItems.filter(item => isSameDay(item.scheduledAt, day)); daysOfWeek.push({ date: day, dayName: format(day, "EEEE", { locale: ptBR }), items: itemsForThisDay, }); }

  // Links da semana
  const prevWeekLink = `/${username}?weekOffset=${weekOffset - 1}`;
  const nextWeekLink = `/${username}?weekOffset=${weekOffset + 1}`;
  const currentWeekLink = `/${username}`; // Link para "Semana Atual"
  // --- [FIM DA LÓGICA DE BUSCA DE DADOS] ---


  return (
    <div className={cn("bg-background text-foreground")}>
      <div className={cn("container mx-auto max-w-5xl px-4 pb-8 md:px-6 md:pb-12 lg:px-8 lg:py-16 pt-8 md:pt-12 lg:pt-16")}>

        {/* Cabeçalho */}
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
              {user.name || user.username}
            </h1>
            {user.bio && (
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                {user.bio}
              </p>
            )}
        </div>

        {/* Layout de Abas */}
        <Tabs defaultValue="schedule" className="w-full">
          
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="schedule">Cronograma</TabsTrigger>
            <TabsTrigger value="lists">Listas</TabsTrigger>
          </TabsList>

          {/* Conteúdo da Aba "Cronograma" */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      
                      <CardTitle className="text-2xl md:text-3xl text-primary">
                          Cronograma
                          {weekOffset === 0 ? (
                            <span className="text-lg md:text-xl text-muted-foreground ml-2">(Semana Atual)</span>
                          ) : (
                            <span className="text-lg md:text-xl text-muted-foreground ml-2">(Semana de {format(startOfThisWeek, "dd/MM")})</span>
                          )}
                      </CardTitle>
                      
                      <div className="flex gap-2">
                          {/* Só mostra o botão "Anterior" se não estivermos no limite (-1) */}
                          {weekOffset > -1 && (
                            <Link 
                              href={prevWeekLink} 
                              className={buttonVariants({ variant: "outline", size: "sm" })}
                            >
                              &larr; Anterior
                            </Link>
                          )}

                          {weekOffset !== 0 && (
                            <Link 
                              href={currentWeekLink} 
                              className={buttonVariants({ variant: "outline", size: "sm" })}
                            >
                              Semana Atual
                            </Link>
                          )}

                          <Link 
                            href={nextWeekLink} 
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                          >
                            Próxima &rarr;
                          </Link>
                      </div>
                  </div>
              </CardHeader>

                <CardContent className="space-y-6">
                  {daysOfWeek.map(day => (
                    <div key={day.date.toString()}>
                      <h3 className="text-lg font-semibold mb-3 capitalize text-primary">
                          {day.dayName} <span className="text-base text-muted-foreground font-normal ml-2">({format(day.date, "dd/MM")})</span>
                      </h3>
                      {day.items.length === 0 ? ( <p className="text-muted-foreground text-sm pl-4">Nenhum item.</p> ) : (
                        <ul className="space-y-3 pl-4 border-l-2">
                          {day.items.map(item => {
                              const isItemWeekly = false; 
                              return !item.media ? null : ( 

                              // --- [MUDANÇA AQUI] ---
                              // Adiciona 'cn' e a classe 'opacity-50' se 'item.isCompleted' for true
                              <li 
                                key={item.id} 
                                className={cn(
                                  "flex items-start gap-4 transition-opacity", 
                                  item.isCompleted && "opacity-50"
                                )}
                              >
                                  <Image src={ item.media.posterPath || "/poster-placeholder.png" } width={50} height={75} alt={item.media.title} className="rounded shadow-sm flex-shrink-0" unoptimized={true} />
                                  <div className="flex-grow">
                                      <span className="font-semibold text-lg text-foreground line-clamp-2 flex items-center gap-1" title={item.media.title}>
                                        {item.media.title}
                                        {isItemWeekly && (<FiRefreshCw className="inline text-blue-500 flex-shrink-0" title="Item Semanal"/>)}
                                      </span>
                                  </div>
                                  {item.horario && ( <div className="flex-shrink-0 text-right"> <span className="text-sm font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full whitespace-nowrap"> {item.horario} </span> </div> )}
                              </li>
                              // --- [FIM DA MUDANÇA] ---

                              );
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </CardContent>
            </Card>
          </TabsContent>

          {/* Conteúdo da Aba "Listas" */}
          <TabsContent value="lists">
            <UserListsClient
              username={decodedUsername}
              initialToWatch={initialToWatch}
              initialWatching={initialWatching}
              initialWatched={initialWatched}
              initialDropped={initialDropped}
            />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}