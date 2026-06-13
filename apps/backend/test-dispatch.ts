import axios from 'axios'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDispatch() {
  console.log('🔍 Finding a segment to target...')
  
  const segment = await prisma.segment.findFirst({
    where: { name: 'VIP Customers' } // Or any segment
  })

  if (!segment) {
    console.log('❌ No segment found.')
    return
  }

  console.log(`✅ Targeting segment: ${segment.name} (${segment.customerCount} customers)`)

  // 1. Create a draft campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: `Test Campaign - ${new Date().getTime()}`,
      segmentId: segment.id,
      channel: 'sms',
      messageTemplate: 'Hi {{name}}, here is a 10% off coupon code for your next purchase: TEST10',
      status: 'draft',
      stats: { create: { total: segment.customerCount } }
    }
  })

  console.log(`✅ Created campaign: ${campaign.id} (${campaign.name})`)

  // 2. Hit the dispatch endpoint
  console.log(`🚀 Hitting POST /api/campaigns/${campaign.id}/dispatch ...`)
  
  try {
    const response = await axios.post(`http://localhost:3001/api/campaigns/${campaign.id}/dispatch`)
    console.log('🎉 Dispatch Response:', response.data)
  } catch (error: any) {
    console.error('❌ Dispatch failed:', error.response?.data || error.message)
  }
}

testDispatch().finally(() => prisma.$disconnect())
