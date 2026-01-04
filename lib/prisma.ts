import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 👇 Adicione esta linha para o TypeScript ignorar o erro de tipagem
// @ts-ignore: BigInt extension
BigInt.prototype.toJSON = function () {
  return this.toString();
};

export default prisma;