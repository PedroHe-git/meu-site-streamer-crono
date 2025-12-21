"use client"; // Necessário para usar hooks como useState/useEffect

import { Calendar } from "lucide-react";
import { useState, useEffect } from "react"; // 1. Importe os hooks

// (Opcional, mas recomendado) Define um tipo para o item da agenda
type ScheduleItem = {
  day: string;
  event: string;
  active: boolean;
};

// Dados de exemplo para mostrar enquanto a API carrega (skeleton/loading)
const loadingSchedule: ScheduleItem[] = [
  { day: "Seg", event: "...", active: false },
  { day: "Ter", event: "...", active: false },
  { day: "Qua", event: "...", active: false },
  { day: "Qui", event: "...", active: false },
  { day: "Sex", event: "...", active: false },
  { day: "Sáb", event: "...", active: false },
  { day: "Dom", event: "...", active: false },
];

export function WeekCalendar() {
  // 2. Crie um estado para armazenar os dados da agenda
  const [schedule, setSchedule] = useState<ScheduleItem[]>(loadingSchedule);
  const [isLoading, setIsLoading] = useState(true);

  // 3. Use useEffect para buscar os dados da API quando o componente carregar
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        // --- SUBSTITUA PELA SUA CHAMADA REAL DA API ---
        // Ex: const response = await fetch('/api/schedule');
        // const data = await response.json();
        
        // Simulando uma chamada de API com os dados da sua print:
        const dataFromApi: ScheduleItem[] = [
          { day: "Seg", event: "Folga", active: false },
          { day: "Ter", event: "O Senhor dos Anéis: Os Anéis de Poder / Jogo do Dinheiro / Resident Evil: O Hóspede Maldito", active: true },
          { day: "Qua", event: "O Senhor dos Anéis: Os Anéis de Poder / A Lenda de Tarzan / Quarteto Fantástico: Primeiros Passos", active: true },
          { day: "Qui", event: "Folga", active: false },
          { day: "Sex", event: "O Senhor dos Anéis: Os Anéis de Poder / Invocação do Mal 3: A Ordem do Demônio / Alvin e os Esquilos", active: true },
          { day: "Sáb", event: "Reacher / Dragon Ball Z / As Tartarugas Ninja: Fora das Sombras / Frankenstein", active: true },
          { day: "Dom", event: "Reacher / Dragon Ball Z / Speed Racer / A Série Divergente: Insurgente", active: true },
        ];
        // ----------------------------------------------
        
        // 4. Atualize o estado com os dados recebidos
        setSchedule(dataFromApi);

      } catch (error) {
        console.error("Erro ao buscar agenda:", error);
        // (Opcional) Você pode setar um estado de erro aqui
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, []); // O array vazio [] significa que isso roda apenas uma vez

  // 5. O JSX abaixo agora usa a variável 'schedule' do *estado*
  //    Qualquer mudança no estado (via setSchedule) fará o React
  //    redesenhar esta parte automaticamente.
  
  return (
    <section id="agenda" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-center mb-8">Agenda da Semana</h2>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
              {schedule.map((item, index) => (
                <div
                  key={index}
                  className={`text-center p-4 rounded-lg border-2 transition-all flex flex-col h-full ${
                    item.active
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 bg-gray-50"
                  } ${isLoading ? 'animate-pulse' : ''}`} // Adiciona animação de pulse enquanto carrega
                >
                  <div
                    className={`font-semibold mb-2 ${
                      item.active ? "text-purple-600" : "text-gray-400"
                    }`}
                  >
                    {item.day}
                  </div>
                    
                  {item.active ? (
                    <ul className="text-sm font-medium text-gray-900 text-left flex-grow list-none pl-0">  
                      {item.event.split(" / ").map((subEvent, subIndex) => (
                        <li key={subIndex} className="mb-1.5 last:mb-0">
                          {subEvent.trim()}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-gray-500 flex-grow flex items-center justify-center">
                      {item.event}
                    </div>
                  )}

                  {item.active && (
                    <div className="mt-auto flex justify-center pt-2">
                      <div className="h-2 w-2 rounded-full bg-purple-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                Todos os horários em GMT-3 (Brasília)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}