import { PrismaClient } from '@prisma/client'

// Supabase free tier supports ~20 connections via pgBouncer pooler.
// Keep connection_limit low to avoid P1001 drops under concurrent load.
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
})

// ── Retry wrapper ────────────────────────────────────────────────────────────
// Supabase pooler occasionally drops connections (P1001 / P1017).
// Retry up to 3 times with exponential backoff before propagating the error.
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 500
): Promise<T> {
  let lastError: any
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      const isConnectionError = err?.code === 'P1001' || err?.code === 'P1017' || err?.code === 'P2024'
      if (!isConnectionError || attempt === retries) throw err
      console.warn(`[Prisma] Connection error (${err.code}), retrying ${attempt}/${retries} in ${delayMs * attempt}ms...`)
      await new Promise(r => setTimeout(r, delayMs * attempt))
      lastError = err
    }
  }
  throw lastError
}

export default prisma
