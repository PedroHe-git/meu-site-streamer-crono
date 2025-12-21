// scripts/restore-me.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const backupPath = path.join(process.cwd(), 'meu-backup.json');

  if (!fs.existsSync(backupPath)) {
    console.error("❌ Arquivo 'meu-backup.json' não encontrado na raiz.");
    process.exit(1);
  }

  const userData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  console.log(`🔄 Iniciando restauração para: ${userData.email}`);

  // 1. Criar o Usuário
  const { mediaStatuses, scheduleItems, accounts, sessions, ...userProps } = userData;

  const user = await prisma.user.upsert({
    where: { email: userProps.email },
    update: userProps,
    create: userProps,
  });

  console.log(`👤 Usuário restaurado: ${user.name}`);

  // 2. Restaurar Contas
  if (accounts && accounts.length > 0) {
    for (const account of accounts) {
      await prisma.account.create({
        data: { ...account, userId: user.id }
      }).catch(() => {});
    }
    console.log(`🔑 Contas restauradas.`);
  }

  // 3. Restaurar Mídias Únicas
  const allMedias = [
    ...(mediaStatuses || []).map((s: any) => s.media),
    ...(scheduleItems || []).map((s: any) => s.media)
  ].filter((v, i, a) => v && a.findIndex(t => (t.id === v.id)) === i);

  console.log(`🎬 Restaurando ${allMedias.length} filmes/jogos...`);
  
  for (const media of allMedias) {
    if(!media) continue;
    await prisma.media.upsert({
      where: { id: media.id },
      update: media,
      create: media,
    });
  }

  // 4. Restaurar Listas e Cronograma
  console.log(`📝 Restaurando listas e cronograma...`);
  
  if (mediaStatuses) {
    for (const status of mediaStatuses) {
      const { media, ...statusData } = status;
      await prisma.mediaStatus.create({
        data: { ...statusData, userId: user.id, mediaId: media.id }
      }).catch(() => {});
    }
  }

  if (scheduleItems) {
    for (const item of scheduleItems) {
      const { media, ...itemData } = item;
      await prisma.scheduleItem.create({
        data: { ...itemData, userId: user.id, mediaId: media.id }
      }).catch(() => {});
    }
  }

  console.log("✅ Restauração Completa!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });