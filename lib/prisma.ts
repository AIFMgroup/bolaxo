import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const isProd = process.env.NODE_ENV === 'production'
const logQueries = process.env.PRISMA_LOG_QUERIES === 'true'

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // In production, avoid logging queries by default (PII + cost).
    log: logQueries ? ['query', 'error', 'warn'] : isProd ? ['error', 'warn'] : ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
