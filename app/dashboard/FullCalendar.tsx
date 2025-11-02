"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Calendar,
  dateFnsLocalizer,
  Event,
  Views,
  type View,
  type EventProps,
} from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addHours,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { ScheduleItem, Media, MediaType } from "@prisma/client";
import "react-big-calendar/lib/css/react-big-calendar.css"; // Mantenha este

// Tipagem (Igual)
type ScheduleItemWithMedia = ScheduleItem & { media: Media };
interface CalendarEvent extends Event {
  resource: ScheduleItemWithMedia;
}

// Configuração do localizador (Igual)
const locales = {
  "pt-BR": ptBR,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  // --- [ CORREÇÃO AQUI ] ---
  // Adiciona o tipo 'Date' ao parâmetro
  startOfWeek: (date: Date) => startOfWeek(date, { locale: ptBR }),
  // --- [ FIM DA CORREÇÃO ] ---
  getDay,
  locales,
});

// Mensagens em Português (Igual)
const messages = {
  allDay: "Dia todo",
  previous: "<",
  next: ">",
  today: "Hoje",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "Não há eventos neste período.",
};

// Função de ajuda (Igual)
const getMonthRange = (date: Date) => {
  const start = startOfDay(startOfMonth(date));
  const end = endOfDay(endOfMonth(date));
  return { start, end };
};

// Componente customizado de evento (Adicione alguns estilos Tailwind)
function CustomEventComponent({ event }: EventProps<CalendarEvent>) {
  const { title, resource } = event;
  const posterPath = resource.media.posterPath;

  return (
    <div className="flex items-center gap-1.5 h-full overflow-hidden p-0.5">
      {posterPath && (
        <Image
          src={posterPath}
          alt={title || "Poster"}
          width={16}
          height={24}
          className="rounded-sm flex-shrink-0 object-cover"
          unoptimized={true}
          style={{ width: "16px", height: "24px" }}
        />
      )}
      <span className="truncate text-xs font-semibold" title={title}>
        {title}
      </span>
    </div>
  );
}

export default function FullCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.MONTH);

  const fetchEvents = useCallback(async (fetchDate: Date) => {
    setLoading(true);
    try {
      const { start, end } = getMonthRange(fetchDate);
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      const res = await fetch(`/api/schedule?${params.toString()}`);
      if (!res.ok) throw new Error("Falha ao buscar agendamentos");

      const data: ScheduleItemWithMedia[] = await res.json();
      const formattedEvents: CalendarEvent[] = data.map((item) => {
        const eventDate = new Date(item.scheduledAt);
        let startDate = eventDate;
        let endDate = eventDate;

        if (item.horario) {
          const [hours, minutes] = item.horario.split(":").map(Number);
          startDate = new Date(
            eventDate.getFullYear(),
            eventDate.getMonth(),
            eventDate.getDate(),
            hours,
            minutes
          );
          const duration = item.media.mediaType === MediaType.MOVIE ? 2 : 1;
          endDate = addHours(startDate, duration);
        }

        return {
          title: item.media.title,
          start: startDate,
          end: endDate,
          allDay: !item.horario,
          resource: item,
        };
      });
      setEvents(formattedEvents);
    } catch (error) {
      console.error(error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(date);
  }, [date, view, fetchEvents]);

  return (
    <div className="h-[700px] relative">
      {loading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-md">
          <span className="text-muted-foreground">A carregar...</span>
        </div>
      )}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
        culture="pt-BR"
        messages={messages}
        date={date}
        view={view}
        onNavigate={(newDate) => setDate(newDate)}
        onView={(newView) => setView(newView)}
        components={{
          event: CustomEventComponent,
        }}
        eventPropGetter={(event: CalendarEvent) => {
          const isCompleted = event.resource.isCompleted;
          return {
            style: {
              // Os estilos de fundo agora serão tratados no CSS global,
              // mas ainda podemos usar aqui para cores específicas se necessário.
              // Garantimos que a cor do texto seja branca para dark mode
              color: 'white', // <-- Garante texto branco nos eventos
              backgroundColor: isCompleted ? "#5a6268" : "#6366F1", // Pode ajustar estas cores
              opacity: isCompleted ? 0.7 : 1,
              border: "none",
            },
          };
        }}
      />
    </div>
  );
}