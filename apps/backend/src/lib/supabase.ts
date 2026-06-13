import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
import { randomBytes } from 'crypto'

const supabaseUrl = process.env.SUPABASE_URL || 'https://nkwcidfwbeuxreifdvrq.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseKey) {
  console.warn('⚠️ Missing SUPABASE_SERVICE_ROLE_KEY')
}

// Global polyfill for WebSocket to prevent Supabase JS crashing on Node 20
if (!global.WebSocket) {
  (global as any).WebSocket = WebSocket
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper to generate a Prisma-compatible CUID-like ID
export function generateId() {
  return 'c' + randomBytes(12).toString('hex')
}
