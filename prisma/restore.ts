import { PrismaClient, UserRole } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

async function main() {
  const backupPath = path.join(__dirname, 'meu-backup.json')
  
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Arquivo não encontrado: ${backupPath}`)
    process.exit(1)
  }

  const rawData = fs.readFileSync(backupPath, 'utf-8')
  const userData = JSON.parse(rawData)

  console.log("🔄 Atualizando usuário com as credenciais corretas...")

  try {
    await prisma.user.upsert({
      where: { id: userData.id },
      update: {
        // 👇 AQUI ESTÁ A CORREÇÃO: Restaurando a senha no Update
        hashedPassword: userData.hashedPassword, 
        role: UserRole.CREATOR,
        image: userData.image,
        bio: userData.bio,
        profileBannerUrl: userData.profileBannerUrl,
        twitchUsername: userData.twitchUsername,
      },
      create: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        username: userData.username,
        // 👇 AQUI TAMBÉM: Restaurando a senha no Create
        hashedPassword: userData.hashedPassword, 
        role: UserRole.CREATOR,
        image: userData.image,
        emailVerified: userData.emailVerified ? new Date(userData.emailVerified) : null,
        bio: userData.bio,
        profileBannerUrl: userData.profileBannerUrl,
        twitchUsername: userData.twitchUsername,
        discordWebhookUrl: userData.discordWebhookUrl,
        showToWatchList: userData.showToWatchList ?? true,
        showWatchingList: userData.showWatchingList ?? true,
        showWatchedList: userData.showWatchedList ?? true,
        showDroppedList: userData.showDroppedList ?? false,
      }
    })
    console.log(`✅ Senha e dados de ${userData.username} restaurados!`)
  } catch (error) {
    console.error("❌ Erro ao atualizar usuário:", error)
  }

  // Restaurar contas vinculadas (Google/Twitch) caso você use login social
  if (userData.accounts && Array.isArray(userData.accounts)) {
    console.log(`🔑 Verificando conexões de conta (OAuth)...`)
    for (const acc of userData.accounts) {
      try {
        const existing = await prisma.account.findFirst({
            where: { provider: acc.provider, providerAccountId: acc.providerAccountId }
        })

        if (!existing) {
            await prisma.account.create({
            data: {
                userId: userData.id,
                type: acc.type,
                provider: acc.provider,
                providerAccountId: acc.providerAccountId,
                refresh_token: acc.refresh_token,
                access_token: acc.access_token,
                expires_at: acc.expires_at,
                token_type: acc.token_type,
                scope: acc.scope,
                id_token: acc.id_token,
                session_state: acc.session_state,
            }
            })
            console.log(`   -> Conexão ${acc.provider} restaurada.`)
        }
      } catch (e) {
        // Ignora erros
      }
    }
  }

  console.log("✅ Processo finalizado! Tente logar agora.")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })