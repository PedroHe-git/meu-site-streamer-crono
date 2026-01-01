// scripts/backup-me.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// --- CONFIGURAÇÃO ---
const MEU_EMAIL = "cronogramamahmoojen@gmail.com"; // <--- COLOQUE SEU EMAIL AQUI
// --------------------

async function main() {
  console.log(`🔍 Buscando dados completos para o usuário: ${MEU_EMAIL}...`);

  const user = await prisma.user.findUnique({
    where: { email: MEU_EMAIL },
    include: {
      // Traz as contas vinculadas (Google/Twitch/etc)
      accounts: true, 
      
      // Traz os status (Assistindo/Assistido) E os dados dos filmes/jogos
      mediaStatuses: {
        include: {
          media: true 
        }
      },
      
      // Traz o cronograma E os dados dos itens
      scheduleItems: {
        include: {
          media: true
        }
      },
      
      socialItems: true,
      sponsors: true,

      // Se tiver sessões ativas (opcional)
      sessions: true,
    }
  });

  if (!user) {
    console.error("❌ Usuário não encontrado! Verifique o email digitado.");
    process.exit(1);
  }

  // Salva em um arquivo JSON na raiz do projeto
  const backupPath = path.join(process.cwd(), 'meu-backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(user, null, 2));

  console.log(`✅ Backup realizado com sucesso!`);
  console.log(`📁 Arquivo salvo em: ${backupPath}`);
  console.log(`📊 Totais exportados:`);
  console.log(`   - Mídias na lista: ${user.mediaStatuses.length}`);
  console.log(`   - Itens no cronograma: ${user.scheduleItems.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });