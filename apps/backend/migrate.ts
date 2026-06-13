/**
 * migrate.ts
 * Copies ALL data from Supabase → Neon in correct FK order.
 * Run with: npx ts-node migrate.ts
 */
import { PrismaClient } from '@prisma/client'

// ── Source: Supabase (transaction pooler — most reliable for bulk reads) ──────
const src = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.nkwcidfwbeuxreifdvrq:ALOVESN20409@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=3&connect_timeout=30'
    }
  }
})

// ── Destination: Neon ─────────────────────────────────────────────────────────
const dst = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_dB2UZYKQ0fzt@ep-nameless-meadow-aozg8biu-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    }
  }
})

const BATCH = 100

async function retry<T>(fn: () => Promise<T>, retries = 5, delay = 1000): Promise<T> {
  for (let i = 1; i <= retries; i++) {
    try { return await fn() }
    catch (e: any) {
      if (i === retries) throw e
      console.warn(`  Retry ${i}/${retries} after error: ${e.message?.slice(0, 80)}`)
      await new Promise(r => setTimeout(r, delay * i))
    }
  }
  throw new Error('unreachable')
}

async function migrate() {
  console.log('\n🚀 XenoCRM — Supabase → Neon Migration\n')

  // ── 1. Customers ─────────────────────────────────────────────────────────────
  console.log('📦 Migrating Customers...')
  const customers = await retry(() => src.customer.findMany())
  console.log(`   Found ${customers.length} customers`)
  for (let i = 0; i < customers.length; i += BATCH) {
    const batch = customers.slice(i, i + BATCH)
    await dst.customer.createMany({ data: batch, skipDuplicates: true })
    process.stdout.write(`   ${Math.min(i + BATCH, customers.length)}/${customers.length}\r`)
  }
  console.log(`   ✓ ${customers.length} customers migrated`)

  // ── 2. Segments ──────────────────────────────────────────────────────────────
  console.log('📦 Migrating Segments...')
  const segments = await retry(() => src.segment.findMany())
  console.log(`   Found ${segments.length} segments`)
  for (let i = 0; i < segments.length; i += BATCH) {
    await dst.segment.createMany({ data: segments.slice(i, i + BATCH), skipDuplicates: true })
  }
  console.log(`   ✓ ${segments.length} segments migrated`)

  // ── 3. Campaigns ─────────────────────────────────────────────────────────────
  console.log('📦 Migrating Campaigns...')
  const campaigns = await retry(() => src.campaign.findMany())
  console.log(`   Found ${campaigns.length} campaigns`)
  for (let i = 0; i < campaigns.length; i += BATCH) {
    await dst.campaign.createMany({ data: campaigns.slice(i, i + BATCH), skipDuplicates: true })
  }
  console.log(`   ✓ ${campaigns.length} campaigns migrated`)

  // ── 4. CampaignStats ─────────────────────────────────────────────────────────
  console.log('📦 Migrating CampaignStats...')
  const campaignStats = await retry(() => src.campaignStats.findMany())
  console.log(`   Found ${campaignStats.length} stats records`)
  for (let i = 0; i < campaignStats.length; i += BATCH) {
    await dst.campaignStats.createMany({ data: campaignStats.slice(i, i + BATCH), skipDuplicates: true })
  }
  console.log(`   ✓ ${campaignStats.length} campaign stats migrated`)

  // ── 5. SegmentStats ──────────────────────────────────────────────────────────
  console.log('📦 Migrating SegmentStats...')
  const segmentStats = await retry(() => src.segmentStats.findMany())
  console.log(`   Found ${segmentStats.length} segment stats records`)
  for (let i = 0; i < segmentStats.length; i += BATCH) {
    await dst.segmentStats.createMany({ data: segmentStats.slice(i, i + BATCH), skipDuplicates: true })
  }
  console.log(`   ✓ ${segmentStats.length} segment stats migrated`)

  // ── 6. Communications ────────────────────────────────────────────────────────
  console.log('📦 Migrating Communications (this may take a moment)...')
  const totalComms = await retry(() => src.communication.count())
  console.log(`   Found ${totalComms} communications`)
  let commCursor: string | undefined
  let commDone = 0
  while (commDone < totalComms) {
    const batch = await retry(() => src.communication.findMany({
      take: BATCH,
      skip: commCursor ? 1 : 0,
      cursor: commCursor ? { id: commCursor } : undefined,
      orderBy: { id: 'asc' }
    }))
    if (batch.length === 0) break
    await dst.communication.createMany({ data: batch, skipDuplicates: true })
    commCursor = batch[batch.length - 1].id
    commDone += batch.length
    process.stdout.write(`   ${commDone}/${totalComms}\r`)
  }
  console.log(`   ✓ ${commDone} communications migrated`)

  // ── 7. Orders ────────────────────────────────────────────────────────────────
  console.log('📦 Migrating Orders...')
  const orders = await retry(() => src.order.findMany())
  console.log(`   Found ${orders.length} orders`)
  for (let i = 0; i < orders.length; i += BATCH) {
    await dst.order.createMany({ data: orders.slice(i, i + BATCH), skipDuplicates: true })
  }
  console.log(`   ✓ ${orders.length} orders migrated`)

  console.log('\n✅ Migration complete! All data is now in Neon.\n')

  await src.$disconnect()
  await dst.$disconnect()
}

migrate().catch(async (e) => {
  console.error('\n❌ Migration failed:', e.message)
  await src.$disconnect()
  await dst.$disconnect()
  process.exit(1)
})
