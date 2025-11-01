// app/[username]/page.tsx (Atualizado com Lógica de Privacidade)

import prisma from '@/lib/prisma';
import { notFound } from "next/navigation";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { ScheduleItem, Media, MediaStatus, Prisma, UserRole, ProfileVisibility } from '@prisma/client'; // Importa ProfileVisibility
import Image from "next/image";
import UserListsClient from '@/app/components/UserListsClient';
import { FiRefreshCw } from 'react-icons/fi';
import { Lock } from 'lucide-react'; // Importa o ícone de cadeado
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Importa a sessão e o novo botão
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions"; //
import FollowButton from "@/app/components/FollowButton"; // O nosso novo componente

// Tipagem
type ScheduleItemWithMedia = ScheduleItem & { media: Media; };
type MediaStatusWithMedia = MediaStatus & { media: Media; };
type DaySchedule = { date: Date; dayName: string; items: ScheduleItemWithMedia[]; };
type InitialListData = { items: MediaStatusWithMedia[]; totalCount: number; };

const PAGE_SIZE_PUBLIC = 20;

export default async function PublicProfilePage({ params, searchParams }: { params: { username: string }, searchParams: { [key: string]: string | string[] | undefined } }) {

  // --- 1. OBTER SESSÃO DO VISITANTE ---
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const visitorId = session?.user?.id;

  // --- 2. OBTER DADOS DO PERFIL VISTO ---
  const { username } = params;
  const decodedUsername = decodeURIComponent(username);
  
  const weekOffset = Math.max(-1, Number(searchParams.weekOffset) || 0);
  const today = new Date();
  const targetDate = addDays(today, weekOffset * 7);
  const weekOptions = { locale: ptBR, weekStartsOn: 1 as const };
  const startOfThisWeek = startOfDay(startOfWeek(targetDate, weekOptions));
  const endOfThisWeek = endOfDay(endOfWeek(targetDate, weekOptions));

  // Busca o utilizador (profileUser) e o novo campo de visibilidade
  const profileUser = await prisma.user.findUnique({
    where: { username: decodedUsername },
    select: {
        id: true, 
        name: true, 
        username: true, 
        role: true,
        bio: true,
        profileVisibility: true // <-- SELECIONA O NOVO CAMPO
      }
  });

  if (!profileUser) { notFound(); }

  // --- 3. VERIFICAR ESTADO "A SEGUIR" ---
  let isFollowing = false;
  if (visitorId) {
    const followRecord = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: visitorId,
          followingId: profileUser.id,
        },
      },
    });
    isFollowing = !!followRecord;
  }

  // --- 4. VERIFICAR PERMISSÃO DE VISUALIZAÇÃO ---
  const isPublic = profileUser.profileVisibility === ProfileVisibility.PUBLIC;
  const isOwnProfile = visitorId === profileUser.id;
  const isLoggedIn = !!visitorId;
  
  // O visitante pode ver o perfil se:
  // 1. O perfil for público.
  // 2. O visitante for o dono do perfil.
  // 3. O visitante estiver logado E seguir o criador (e o perfil for FOLLOWERS_ONLY).
  const canViewProfile = isPublic || isOwnProfile || (isLoggedIn && isFollowing);

  // --- 5. DEFINIR CONDIÇÕES DE VISIBILIDADE DO BOTÃO ---
  const canFollow = profileUser.role === 'CREATOR';
  const isOwnProfileForButton = visitorId === profileUser.id; // Renomeado para evitar conflito
  
  const showFollowButton = isLoggedIn && canFollow && !isOwnProfileForButton;

  // --- 6. CARREGAMENTO CONDICIONAL DE DADOS ---
  // Só buscamos os dados das listas e cronograma se o visitante PUDER VER
  
  let scheduleItems: ScheduleItemWithMedia[] = [];
  let initialToWatch: InitialListData = { items: [], totalCount: 0 };
  let initialWatched: InitialListData = { items: [], totalCount: 0 };
  let daysOfWeek: DaySchedule[] = [];
  
  if (canViewProfile) {
    const scheduleItemsDb = await prisma.scheduleItem.findMany({ 
      where: { 
        userId: profileUser.id, 
        scheduledAt: { gte: startOfThisWeek, lte: endOfThisWeek } 
      }, 
      include: { media: true }, 
      orderBy: [{ scheduledAt: 'asc' }, { horario: 'asc' }], 
    });
    scheduleItems = scheduleItemsDb as ScheduleItemWithMedia[];
    
    const fetchInitialList = async (status: 'TO_WATCH' | 'WATCHED'): Promise<InitialListData> => { 
      const whereCondition: Prisma.MediaStatusWhereInput = { userId: profileUser.id, status: status }; 
      const [items, totalCount] = await Promise.all([ 
        prisma.mediaStatus.findMany({ where: whereCondition, include: { media: true }, take: PAGE_SIZE_PUBLIC, orderBy: { media: { title: 'asc' } } }), 
        prisma.mediaStatus.count({ where: whereCondition }) 
      ]); 
      return { items: items as MediaStatusWithMedia[], totalCount }; 
    };
    
    [initialToWatch, initialWatched] = await Promise.all([ 
      fetchInitialList("TO_WATCH"), 
      fetchInitialList("WATCHED") 
    ]);

    for (let i = 0; i < 7; i++) { 
      const day = addDays(startOfThisWeek, i); 
      const itemsForThisDay = scheduleItems.filter(item => isSameDay(item.scheduledAt, day)); 
      daysOfWeek.push({ 
        date: day, 
        dayName: format(day, "EEEE", { locale: ptBR }), 
        items: itemsForThisDay, 
      }); 
    }
  }

  const initialWatching: InitialListData = { items: [], totalCount: 0 };
  const initialDropped: InitialListData = { items: [], totalCount: 0 };
  
  const prevWeekLink = `/${username}?weekOffset=${weekOffset - 1}`;
  const nextWeekLink = `/${username}?weekOffset=${weekOffset + 1}`;
  const currentWeekLink = `/${username}`; 
  // --- FIM DA BUSCA DE DADOS ---


  return (
    <div className={cn("bg-background text-foreground")}>
      <div className={cn("container mx-auto max-w-5xl px-4 pb-8 md:px-6 md:pb-12 lg:px-8 lg:py-16 pt-8 md:pt-12 lg:pt-16")}>

        {/* Cabeçalho (Sempre visível) */}
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
              {profileUser.name || profileUser.username}
            </h1>
            {profileUser.bio && (
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                {profileUser.bio}
              </p>
            )}

            {/* Renderiza o Botão de Seguir */}
            <div className="mt-6">
              {showFollowButton && (
                <FollowButton
                  initialIsFollowing={isFollowing}
                  username={decodedUsername}
                />
              )}
            </div>
        </div>

        {/* --- CONTEÚDO CONDICIONAL --- */}
        {canViewProfile ? (
          // O visitante PODE VER: Renderiza as Abas
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
                                <li 
                                  key={item.id} 
                                  className={cn(
                                    "flex items-start gap-4 transition-opacity", 
                                    // @ts-ignore
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
        ) : (
          // O visitante NÃO PODE VER: Renderiza a mensagem de perfil privado
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <Lock className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Este perfil é privado</h2>
                <p className="text-muted-foreground text-sm">
                  {isLoggedIn ? 
                    `Siga ${profileUser.name || profileUser.username} para ver o seu cronograma e listas.` :
                    `Faça login e siga ${profileUser.name || profileUser.username} para ver o seu perfil.`
                  }
                </p>
                
                {/* Opcional: Adicionar um botão de Login se o visitante não estiver logado */}
                {!isLoggedIn && (
                  <Button asChild className="mt-4">
                    <Link href="/auth/signin">Fazer Login</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        {/* --- FIM DO CONTEÚDO CONDICIONAL --- */}

      </div>
    </div>
  );
}