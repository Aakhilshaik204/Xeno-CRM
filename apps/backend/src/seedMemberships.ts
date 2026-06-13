import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tiers = ['Platinum', 'Gold', 'Silver', 'None']
  const customers = await prisma.customer.findMany()

  for (const c of customers) {
    if (!c.membershipTier || c.membershipTier === 'None') {
      await prisma.customer.update({
        where: { id: c.id },
        data: { membershipTier: tiers[Math.floor(Math.random() * tiers.length)] }
      })
    }
  }
  console.log('Membership tiers seeded successfully.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
