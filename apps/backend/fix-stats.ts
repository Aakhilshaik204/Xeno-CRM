import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function fixAllCampaignStats() {
  const campaigns = await prisma.campaign.findMany({ select: { id: true, name: true } })
  console.log(`Fixing stats for ${campaigns.length} campaigns...`)

  for (const c of campaigns) {
    const comms = await prisma.communication.findMany({ where: { campaignId: c.id } })
    const total     = comms.length
    const sent      = comms.filter(x => x.sentAt).length
    const delivered = comms.filter(x => x.deliveredAt).length
    const opened    = comms.filter(x => x.openedAt).length
    const read      = comms.filter(x => x.readAt).length
    const clicked   = comms.filter(x => x.clickedAt).length
    const converted = comms.filter(x => x.convertedAt).length
    const failed    = comms.filter(x => x.failedAt).length

    const orders = await prisma.order.findMany({
      where: { communicationId: { in: comms.map(x => x.id) } }
    })
    const revenue = orders.reduce((s, o) => s + o.amount, 0)

    await prisma.campaignStats.upsert({
      where: { campaignId: c.id },
      create: { campaignId: c.id, total, sent, delivered, opened, read, clicked, converted, failed, revenue },
      update: { total, sent, delivered, opened, read, clicked, converted, failed, revenue }
    })

    console.log(`  ✓ ${c.name}: total=${total}, delivered=${delivered}, opened=${opened}, converted=${converted}, revenue=₹${revenue}`)
  }

  await prisma.$disconnect()
  console.log('Done.')
}

fixAllCampaignStats().catch(e => { console.error(e); process.exit(1) })
