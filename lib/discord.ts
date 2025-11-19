// lib/discord.ts
import { ScheduleItem, Media } from "@prisma/client";

type ScheduleItemWithMedia = ScheduleItem & { media: Media };

export async function sendWeeklySchedule(webhookUrl: string, streamerName: string, items: ScheduleItemWithMedia[]) {
  if (!webhookUrl || items.length === 0) return;

  // 1. Agrupar itens por Dia
  const groupedItems: Record<string, string[]> = {};

  items.forEach((item) => {
    const date = new Date(item.scheduledAt);
    
    // Formatar data: "Segunda-feira - 20/11"
    const dateKey = new Intl.DateTimeFormat('pt-PT', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
    const dateLabel = dateKey.charAt(0).toUpperCase() + dateKey.slice(1);

    // --- [LÓGICA DE HORÁRIO ALTERADA] ---
    let timePrefix = "";
    
    if (item.horario) {
      // Se tiver horário definido (ex: "1-Primeiro"), formatamos para exibir
      // Remove o número da frente se existir (ex: "1-Primeiro" vira "Primeiro")
      const label = item.horario.includes("-") ? item.horario.split("-")[1] : item.horario;
      timePrefix = `**${label}** — `;
    } 
    // Se item.horario for null (Qualquer Hora), timePrefix fica vazio ""

    // Monta a linha: "• Primeiro — Nome do Jogo (GAME)" ou "• Nome do Jogo (GAME)"
    const line = `• ${timePrefix}${item.media.title} (${item.media.mediaType})`;
    // -------------------------------------
    
    if (!groupedItems[dateLabel]) {
      groupedItems[dateLabel] = [];
    }
    groupedItems[dateLabel].push(line);
  });

  // 2. Converter para Fields do Discord
  const fields = Object.entries(groupedItems).map(([dateLabel, lines]) => ({
    name: dateLabel,
    value: lines.join("\n"),
    inline: false
  }));

  // 3. Montar o Payload
  const payload = {
    username: "Agenda do Streamer",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/4270/4270587.png",
    embeds: [
      {
        title: `📅 Cronograma da Semana: ${streamerName}`,
        description: "Confira os horários das próximas lives e estreias! 🚀",
        color: 10181046, // Roxo
        fields: fields,
        footer: {
          text: "Horários e ordem sujeitos a alterações."
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  // 4. Enviar
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("Erro ao enviar cronograma:", error);
    throw error;
  }
}