// lib/ai.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScheduleItem, Media } from "@prisma/client";

type ScheduleItemWithMedia = ScheduleItem & { media: Media };

// Função que obtém o modelo (mantém-se igual)
function getModel() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("GOOGLE_API_KEY ausente no ambiente");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Usamos o modelo que funcionou para si
    return genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
    });
}

// [IMPORTANTE] Esta função já envia os dados corretos (Tipo e Ano)
// Não precisa de alterá-la.
function simplifySchedule(items: ScheduleItemWithMedia[]): string {
    if (!items || items.length === 0) {
        return "Nenhum item agendado para esta semana.";
    }

    return items
        .map(item => {
            const date = new Date(item.scheduledAt)
                .toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit" });

            const title = item.media.title;
            // Os dados que a IA precisa:
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

// --- [PROMPT ATUALIZADO] ---
// Esta é a função principal com as novas regras
export async function generateScheduleSummary(
    username: string,
    scheduleItems: ScheduleItemWithMedia[]
): Promise<string | null> {

    if (!scheduleItems || scheduleItems.length === 0) {
        return null;
    }

    try {
        const simplifiedData = simplifySchedule(scheduleItems);

        const prompt = `
      Você é o "Hype Man" (apresentador entusiasta) oficial do(a) streamer ${username}.
A sua tarefa é escrever um resumo curto, animado e objetivo (3–5 frases) sobre o cronograma da semana ATUAL.

INFORMAÇÃO IMPORTANTE SOBRE O(A) STREAMER:
- O(A) streamer ${username} é do gênero.
  Use sempre artigos, pronomes e flexões corretas:
  - Se for feminino: "a streamer", "ela", "preparou", etc.
  - Se for masculino: "o streamer", "ele", "preparou", etc.

REGRAS DE ÊNFASE NO NOME (SIGA À RISCA):
- O nome do(a) streamer deve aparecer na **primeira frase obrigatoriamente**.
- O nome do(a) streamer deve ser escrito **sempre em MAIÚSCULAS** no texto (ex.: ${username} → ${username.toUpperCase()}).
- O nome pode ser mencionado novamente 1 ou 2 vezes, caso combine naturalmente com o fluxo da frase.

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

5. **Tom:**  
   - Entusiasmado, leve e curto.  
   - 3 a 5 frases apenas.  
   - Sem exageros e sem inventar nada além dos dados.

6. **Saída final:**  
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
        if (error instanceof Error) {
            console.error("Detalhes:", error.message);
        }
        return null;
    }
}