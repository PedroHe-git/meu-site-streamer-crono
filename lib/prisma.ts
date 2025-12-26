import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

// Configura o WebSocket para funcionar no ambiente Node.js
neonConfig.webSocketConstructor = ws

const connectionString = `${process.env.DATABASE_URL}`

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  // Cria o Pool de conexões do Neon
  const pool = new Pool({ connectionString })
  
  // Cria o adaptador do Prisma para Neon
  const adapter = new PrismaNeon(pool)
  
  // Instancia o PrismaClient usando o adaptador
  return new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma