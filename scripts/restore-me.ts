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

  const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  console.log(`🚀 Iniciando restauração TURBO para: ${data.email}`);

  // 1. Restaurar Usuário
  // Removemos as relações aninhadas para criar o usuário limpo
  const { mediaStatuses, scheduleItems, accounts, sessions, socialItems, sponsors, ...userProps } = data;

  const user = await prisma.user.upsert({
    where: { email: userProps.email },
    update: userProps,
    create: userProps,
  });
  console.log(`✅ Usuário restaurado: ${user.name}`);

  // 2. Restaurar Mídias (Filmes/Séries)
  // Extrai todas as mídias das listas e cronogramas
  const allMediasRaw = [
    ...(mediaStatuses || []).map((s: any) => s.media),
    ...(scheduleItems || []).map((s: any) => s.media)
  ].filter(m => m !== null && m !== undefined);

  // Remove duplicadas baseado no ID
  const uniqueMedias = Array.from(new Map(allMediasRaw.map((m: any) => [m.id, m])).values());

  if (uniqueMedias.length > 0) {
    console.log(`🎬 Restaurando ${uniqueMedias.length} mídias...`);
    // createMany com skipDuplicates é muito mais rápido que loop for
    await prisma.media.createMany({
      data: uniqueMedias,
      skipDuplicates: true,
    });
  }

  // 3. Restaurar Contas Vinculadas
  if (accounts && accounts.length > 0) {
    console.log(`key: Restaurando ${accounts.length} contas...`);
    await prisma.account.createMany({
      data: accounts.map((a: any) => ({ ...a, userId: user.id })),
      skipDuplicates: true,
    });
  }

  // 4. Restaurar Status (Listas)
  if (mediaStatuses && mediaStatuses.length > 0) {
    console.log(`📝 Restaurando ${mediaStatuses.length} itens da lista...`);
    const statusPayload = mediaStatuses.map((item: any) => {
      const { media, ...rest } = item; // Remove o objeto media aninhado
      return { ...rest, userId: user.id, mediaId: media.id };
    });
    
    await prisma.mediaStatus.createMany({
      data: statusPayload,
      skipDuplicates: true,
    });
  }

  // 5. Restaurar Cronograma
  if (scheduleItems && scheduleItems.length > 0) {
    console.log(`📅 Restaurando ${scheduleItems.length} itens do cronograma...`);
    const schedulePayload = scheduleItems.map((item: any) => {
      const { media, ...rest } = item; // Remove o objeto media aninhado
      return { ...rest, userId: user.id, mediaId: media.id };
    });

    await prisma.scheduleItem.createMany({
      data: schedulePayload,
      skipDuplicates: true,
    });
  }

  // 6. Restaurar Redes Sociais (NOVO)
  if (socialItems && socialItems.length > 0) {
    console.log(`📲 Restaurando ${socialItems.length} redes sociais...`);
    await prisma.socialItem.createMany({
      data: socialItems.map((s: any) => ({ ...s, userId: user.id })),
      skipDuplicates: true,
    });
  }

  // 7. Restaurar Patrocinadores (NOVO)
  if (sponsors && sponsors.length > 0) {
    console.log(`🤝 Restaurando ${sponsors.length} patrocinadores...`);
    await prisma.sponsor.createMany({
      data: sponsors.map((s: any) => ({ ...s, userId: user.id })),
      skipDuplicates: true,
    });
  }

  console.log("🏁 Restauração Completa com Sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro na restauração:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });