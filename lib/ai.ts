// lib/ai.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScheduleItem, Media } from "@prisma/client";

type ScheduleItemWithMedia = ScheduleItem & { media: Media };

function getModel() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("GOOGLE_API_KEY ausente no ambiente");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            temperature: 0.4, // Aumentei levemente para ele ser mais criativo nos memes
        },
    });
}

function simplifySchedule(items: ScheduleItemWithMedia[]): string {
    if (!items || items.length === 0) {
        return "Nenhum item agendado para esta semana.";
    }

    return items
        .map(item => {
            const date = new Date(item.scheduledAt)
                .toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit" });

            const title = item.media.title;
            const mediaType = item.media.mediaType;
            const year = item.media.releaseYear;

            let details = `(Tipo: ${mediaType}`;
            if (year) {
                details += `, Ano: ${year}`;
            }
            details += ")";

            if (item.seasonNumber && item.episodeNumber) {
                details += ` (T${item.seasonNumber} E${item.episodeNumber})`;
            }

            return `- ${date}: ${title} ${details}`;
        })
        .join("\n");
}

export async function generateScheduleSummary(
    username: string,
    scheduleItems: ScheduleItemWithMedia[]
): Promise<string | null> {

    if (!scheduleItems || scheduleItems.length === 0) {
        return null;
    }

    try {
        const simplifiedData = simplifySchedule(scheduleItems);

        // --- [MODIFICAÇÃO AQUI] ---
        // Adicionada a regra 7 sobre Memes e Frases Famosas
        const prompt = `
      
INSTRUÇÕES IMPORTANTES (SIGA EXATAMENTE):

1. **Começo obrigatório:** O resumo deve começar mencionando o nome do(a) streamer em MAIÚSCULAS.  
   Exemplo: "Alerta de hype! ${username.toUpperCase()} preparou..."

2. **Uso correto de “Tipo”:**  
   Use o campo "Tipo" apenas para descrever o item, convertendo para português:
   - Movie → "filme"
   - Anime → "anime"
   - Series → "série"
   - Game → "jogo"
   Não invente géneros. Apenas descreva com o "Tipo" fornecido.
   Exemplos válidos:
     - "o filme Duna (2021)"
     - "o anime One Piece – Episódio 12"

3. **Usar apenas os dados fornecidos:**  
   Utilize SOMENTE: Título, Tipo, Ano, Temporada, Episódio, Dia.  
   Não adicionar sinopse, prémios, contexto externo ou qualquer informação inventada.

4. **Variar itens:**  
   O resumo deve mencionar pelo menos 1 ou 2 itens de dias diferentes.

5. **Referências Épicas:**
   Se houver na lista algum título muito famoso ou icônico (ex: Dragon Ball, Star Wars, Vingadores, LOL, clássicos do cinema), você PODE inserir uma **frase de efeito ou meme curto** conhecido pelos fãs.
   Exemplos: 
   - Se for Dragon Ball: "É de mais de oito mil!"
   - Se for Star Wars: "Que a força esteja com ele."
   - Se for um jogo difícil: "Será que vai ter rage?"
   *Importante: Use isso no máximo 1 vez e apenas se encaixar na frase.*   

6. **Tom:**  
   - Entusiasmado, leve e curto.  
   - 3 a 5 frases apenas.  
   - Sem exageros e sem inventar nada além dos dados.

7. **Saída final:**  
   Gere apenas o resumo final, sem explicações sobre as regras.

Cronograma da Semana (dados):
${simplifiedData}

Gere agora o resumo em português, usando corretamente o gênero, deixando o nome do(a) streamer em MAIÚSCULAS, e seguindo TODAS as regras acima.

    `;

        const model = getModel();
        const result = await model.generateContent(prompt);

        return result.response.text().trim();
    } catch (error) {
        console.error("Erro ao gerar resumo da IA:", error);
        return null;
    }
}