import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Wiping database...')
  await prisma.order.deleteMany()
  await prisma.communication.deleteMany()
  await prisma.campaignStats.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.segmentStats.deleteMany()
  await prisma.segment.deleteMany()
  await prisma.customer.deleteMany()
  console.log('Database wiped successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
