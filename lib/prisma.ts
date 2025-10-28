// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// Declara uma variável global para guardar a instância
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Cria a instância do Prisma Client
// Em produção, cria apenas uma vez.
// Em desenvolvimento, reutiliza a instância existente na 'globalThis'
// para evitar criar muitas conexões durante o hot-reloading.
const client = globalThis.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalThis.prisma = client

// Exporta a instância única
export default client