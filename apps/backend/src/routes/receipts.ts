import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import PQueue from 'p-queue'
import { supabase, generateId } from '../lib/supabase'
import { ReceiptPayload } from '@xenocrm/shared-types'

const router = Router()

// Mutex queue to prevent read-modify-write race conditions on stats
const updateQueue = new PQueue({ concurrency: 1 })

// POST /api/receipts
// The Webhook endpoint that receives status updates from the Channel Service
router.post('/', asyncHandler(async (req, res) => {
  const payload = req.body as ReceiptPayload

  if (!payload.commId || !payload.status || !payload.channel) {
    res.status(400).json({ error: 'Missing required fields in receipt payload' })
    return
  }

  const { commId, status, metadata, timestamp } = payload
  const time = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()

  await updateQueue.add(async () => {
    // 1. Fetch the communication record
    const { data: comm } = await supabase.from('Communication').select('*').eq('id', commId).maybeSingle()

    if (!comm) {
      res.status(404).json({ error: 'Communication not found' })
      return
    }

    // 2. Update the communication record status and timestamp
    const updateData: any = {
      status,
      metadata: metadata ? (metadata as any) : undefined
    }

    // Update specific timestamp field based on status
    switch (status) {
      case 'sent': updateData.sentAt = time; break;
      case 'delivered': updateData.deliveredAt = time; break;
      case 'opened': updateData.openedAt = time; break;
      case 'read': updateData.readAt = time; break;
      case 'clicked': updateData.clickedAt = time; break;
      case 'failed': updateData.failedAt = time; break;
      case 'converted': updateData.convertedAt = time; break;
    }

    await supabase.from('Communication').update(updateData).eq('id', commId)

    // 3. Atomically increment the CampaignStats
    // Use read-modify-write as Supabase RPC isn't available.
    // Wrapped in a concurrency=1 queue to act as a mutex and prevent race conditions.
    const statUpdate: any = {}
    let hasUpdate = false
    
    if (status === 'sent' && !comm.sentAt) { statUpdate.sent = 1; hasUpdate = true }
    if (status === 'delivered' && !comm.deliveredAt) { statUpdate.delivered = 1; hasUpdate = true }
    if (status === 'failed' && !comm.failedAt) { statUpdate.failed = 1; hasUpdate = true }
    if (status === 'opened' && !comm.openedAt) { statUpdate.opened = 1; hasUpdate = true }
    if (status === 'read' && !comm.readAt) { statUpdate.read = 1; hasUpdate = true }
    if (status === 'clicked' && !comm.clickedAt) { statUpdate.clicked = 1; hasUpdate = true }
    
    if (status === 'converted' && !comm.convertedAt) {
      statUpdate.converted = 1; hasUpdate = true
      if (metadata?.revenue) {
        statUpdate.revenue = Number(metadata.revenue)
      }
    }

    if (hasUpdate) {
      const { data: stats } = await supabase.from('CampaignStats').select('*').eq('campaignId', comm.campaignId).maybeSingle()
      if (stats) {
        const merged: any = {}
        for (const [k, v] of Object.entries(statUpdate)) {
          merged[k] = (stats[k] || 0) + (v as number)
        }
        await supabase.from('CampaignStats').update(merged).eq('id', stats.id)
      } else {
        await supabase.from('CampaignStats').insert({ id: generateId(), campaignId: comm.campaignId, ...statUpdate })
      }
    }

    // 4. Special handling: If converted, create an Order to link the conversion
    if (status === 'converted' && metadata?.orderId && metadata?.revenue) {
      // Check if order already exists
      const { data: existingOrder } = await supabase.from('Order').select('id').eq('id', metadata.orderId).maybeSingle()

      if (!existingOrder) {
        const items = ['Silk Evening Gown', 'Cashmere Wool Sweater', 'Tailored Linen Suit', 'Summer Floral Dress', 'Leather Handbag', 'Designer Sunglasses', 'Premium Denim Jeans', 'Velvet Blazer']
        const randomItem = items[Math.floor(Math.random() * items.length)]
        
        await supabase.from('Order').insert({
          id: metadata.orderId,
          customerId: comm.customerId,
          amount: Number(metadata.revenue),
          items: [{ name: randomItem, quantity: 1 }],
          communicationId: comm.id,
          createdAt: time
        })
        
        // Update customer aggregates
        const { data: cust } = await supabase.from('Customer').select('id, totalSpend, orderCount').eq('id', comm.customerId).single()
        if (cust) {
          await supabase.from('Customer').update({
            totalSpend: (cust.totalSpend || 0) + Number(metadata.revenue),
            orderCount: (cust.orderCount || 0) + 1,
            lastOrderDate: time
          }).eq('id', comm.customerId)
        }
      }
    }

    res.status(200).json({ success: true, commId, status })
  })
}))

export default router
