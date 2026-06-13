import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { supabase, generateId } from '../lib/supabase'

const router = Router()

// POST /api/orders
// Receive an order, track conversion, and update stats
router.post('/', asyncHandler(async (req, res) => {
  const { customerId, amount, items } = req.body

  if (!customerId || !amount) {
    res.status(400).json({ error: 'customerId and amount are required' })
    return
  }

  // 1. Find the latest communication for this customer to attribute the conversion
  const { data: rawComm } = await supabase
    .from('Communication')
    .select('*, campaign:Campaign(*)')
    .eq('customerId', customerId)
    .neq('status', 'failed')
    .order('queuedAt', { ascending: false })
    .limit(1)
    .maybeSingle()

  const latestComm = rawComm ? {
    ...rawComm,
    campaign: Array.isArray(rawComm.campaign) ? rawComm.campaign[0] || null : rawComm.campaign
  } : null

  // 2. Create the order
  const { data: order } = await supabase.from('Order').insert({
    id: generateId(),
    customerId,
    amount,
    items: items || [],
    communicationId: latestComm?.id
  }).select().single()

  // 3. If attributed, update the communication and campaign stats
  if (latestComm && order) {
    // Update Communication to converted if not already
    if (latestComm.status !== 'converted') {
      await supabase.from('Communication').update({
        status: 'converted',
        convertedAt: new Date().toISOString(),
        metadata: { orderId: order.id, revenue: amount }
      }).eq('id', latestComm.id)

      // Update Campaign Stats
      const { data: cStats } = await supabase.from('CampaignStats').select('id, converted, revenue').eq('campaignId', latestComm.campaignId).maybeSingle()
      if (cStats) {
        await supabase.from('CampaignStats').update({
          converted: (cStats.converted || 0) + 1,
          revenue: (cStats.revenue || 0) + amount
        }).eq('id', cStats.id)
      }
    } else {
      // It was already converted, so just add the extra revenue to the campaign
      const { data: cStats } = await supabase.from('CampaignStats').select('id, revenue').eq('campaignId', latestComm.campaignId).maybeSingle()
      if (cStats) {
        await supabase.from('CampaignStats').update({
          revenue: (cStats.revenue || 0) + amount
        }).eq('id', cStats.id)
      }
    }

    // Update Segment Stats
    if (latestComm.campaign?.segmentId) {
      const { data: sStats } = await supabase.from('SegmentStats').select('id, totalConversions, totalRevenue').eq('segmentId', latestComm.campaign.segmentId).maybeSingle()
      if (sStats) {
        await supabase.from('SegmentStats').update({
          totalConversions: (sStats.totalConversions || 0) + 1,
          totalRevenue: (sStats.totalRevenue || 0) + amount
        }).eq('id', sStats.id)
      }
    }
  }

  // 4. Update Customer's lifetime stats
  const { data: cust } = await supabase.from('Customer').select('id, totalSpend, orderCount').eq('id', customerId).single()
  if (cust) {
    await supabase.from('Customer').update({
      totalSpend: (cust.totalSpend || 0) + amount,
      orderCount: (cust.orderCount || 0) + 1,
      lastOrderDate: new Date().toISOString()
    }).eq('id', customerId)
  }

  res.json({ success: true, order, attributedTo: latestComm?.campaignId || null })
}))

export default router
