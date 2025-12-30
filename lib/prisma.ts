import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const connectionString = `${process.env.DATABASE_URL}`

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  // 👇 A MÁGICA ESTÁ AQUI: idleTimeoutMillis
  const pool = new Pool({ 
    connectionString,
    max: 1, // Limita a 1 conexão por container para não saturar
    idleTimeoutMillis: 1000, // Fecha conexão após 1s sem uso (Isso permite o banco dormir)
    connectionTimeoutMillis: 5000, 
  })
  
  const adapter = new PrismaNeon(pool)
  
  return new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma