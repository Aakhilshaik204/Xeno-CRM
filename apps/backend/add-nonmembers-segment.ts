/**
 * Adds a "Non-Members" segment for customers with membershipTier = 'None'
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Count non-member customers
  const count = await prisma.customer.count({
    where: { membershipTier: 'None' }
  })

  console.log(`Found ${count} non-member customers`)

  // Check if segment already exists
  const existing = await prisma.segment.findFirst({
    where: { name: { contains: 'Non' } }
  })

  if (existing) {
    // Update count
    await prisma.segment.update({
      where: { id: existing.id },
      data: { customerCount: count }
    })
    console.log(`Updated existing segment: ${existing.name} → count = ${count}`)
    return
  }

  // Create segment
  const segment = await prisma.segment.create({
    data: {
      name: 'Non-Members',
      description: 'Customers with no membership tier — great candidates for onboarding campaigns',
      filterConfig: [{ field: 'membershipTier', operator: 'eq', value: 'None' }],
      customerCount: count,
      createdBy: 'user',
    }
  })

  console.log(`Created segment: ${segment.name} (${count} customers) — ID: ${segment.id}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
