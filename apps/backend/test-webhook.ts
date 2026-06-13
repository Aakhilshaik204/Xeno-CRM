import axios from 'axios'
import { ReceiptPayload, Channel, CommStatus } from '@xenocrm/shared-types'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runTest() {
  console.log('🔍 Finding a communication to simulate webhook against...')
  
  const comm = await prisma.communication.findFirst()

  if (!comm) {
    console.log('❌ No communication found in DB to test with. (Did you run seed?)')
    return
  }

  console.log(`✅ Found Comm ID: ${comm.id}. Channel: ${comm.channel}`)
  console.log('🚀 Firing test webhook (simulating "delivered" status)...')

  const payload: ReceiptPayload = {
    commId: comm.id,
    channel: comm.channel as Channel,
    status: 'delivered',
    timestamp: new Date().toISOString()
  }

  try {
    const response = await axios.post('http://localhost:3001/api/receipts', payload)
    console.log('🎉 Webhook Response:', response.data)
  } catch (error: any) {
    console.error('❌ Webhook failed:', error.response?.data || error.message)
  }
}

runTest().finally(() => prisma.$disconnect())
