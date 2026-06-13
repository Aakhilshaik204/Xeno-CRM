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

  console.log('Generating 500 Luxury Store Customers...')
  const firstNames = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'Lucas', 'Isabella', 'Mia', 'Harper', 'Evelyn', 'Alexander', 'Sebastian']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson']
  const cities = ['New York', 'London', 'Paris', 'Tokyo', 'Sydney', 'Berlin', 'Dubai', 'Singapore', 'Mumbai', 'Chennai', 'Hyderabad', 'Milan', 'Los Angeles']
  const tiers = ['Platinum', 'Gold', 'Silver', 'None']

  const mockCustomers = Array.from({ length: 500 }).map(() => {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)]
    const last = lastNames[Math.floor(Math.random() * lastNames.length)]
    return {
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${Math.floor(Math.random() * 1000)}@example.com`,
      phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      city: cities[Math.floor(Math.random() * cities.length)],
      gender: Math.random() > 0.5 ? 'male' : 'female',
      totalSpend: Math.random() > 0.8 ? Math.floor(Math.random() * 50000) + 20000 : Math.floor(Math.random() * 5000) + 100,
      orderCount: Math.floor(Math.random() * 20) + 1,
      membershipTier: tiers[Math.floor(Math.random() * tiers.length)]
    }
  })

  await prisma.customer.createMany({ data: mockCustomers })

  console.log('Generating Segments...')
  const segmentsToCreate = [
    { name: 'Platinum Members', description: 'Our most exclusive shoppers', filterConfig: [{ field: 'membershipTier', operator: 'equals', value: 'Platinum' }] },
    { name: 'Gold Members', description: 'Frequent luxury buyers', filterConfig: [{ field: 'membershipTier', operator: 'equals', value: 'Gold' }] },
    { name: 'Silver Members', description: 'Growing loyal customers', filterConfig: [{ field: 'membershipTier', operator: 'equals', value: 'Silver' }] }
  ]

  for (const seg of segmentsToCreate) {
    const whereClause = buildPrismaWhereClause(seg.filterConfig as any)
    const count = await prisma.customer.count({ where: whereClause })
    
    await prisma.segment.create({
      data: {
        name: seg.name,
        description: seg.description,
        customerCount: count,
        filterConfig: seg.filterConfig as any
      }
    })
    console.log(`Created Segment: ${seg.name} with ${count} customers`)
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
