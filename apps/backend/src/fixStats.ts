import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const campaigns = await prisma.campaign.findMany({ include: { stats: true } })

  for (const campaign of campaigns) {
    const comms = await prisma.communication.findMany({
      where: { campaignId: campaign.id },
      include: { orders: true }
    })

    let sent = 0
    let delivered = 0
    let opened = 0
    let read = 0
    let clicked = 0
    let converted = 0
    let failed = 0
    let revenue = 0

    for (const c of comms) {
      if (c.sentAt) sent++
      if (c.deliveredAt) delivered++
      if (c.openedAt) opened++
      if (c.readAt) read++
      if (c.clickedAt) clicked++
      if (c.failedAt) failed++
      if (c.convertedAt) converted++

      // Sum all orders attributed to this communication
      for (const o of c.orders) {
        revenue += o.amount
      }
    }

    if (campaign.stats) {
      await prisma.campaignStats.update({
        where: { id: campaign.stats.id },
        data: {
          sent, delivered, opened, read, clicked, converted, failed, revenue
        }
      })
    }
  }

  console.log('Campaign stats rebuilt successfully.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
