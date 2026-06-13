import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'

const router = Router()

// GET /api/analytics
router.get('/', asyncHandler(async (req, res) => {
  // Fetch campaigns with stats
  const { data: rawCampaigns } = await supabase
    .from('Campaign')
    .select('*, stats:CampaignStats(*)')
    .in('status', ['completed', 'sent', 'sending'])

  const campaigns = (rawCampaigns || []).map((c: any) => ({
    ...c,
    stats: Array.isArray(c.stats) ? c.stats[0] || null : c.stats
  }))

  // Fetch all orders
  const { data: orders } = await supabase
    .from('Order')
    .select('amount, createdAt')
    .order('createdAt', { ascending: true })

  // 1. KPIs
  const totalRevenue = (orders || []).reduce((sum, o) => sum + o.amount, 0)
  const totalOrders = (orders || []).length
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0

  let totalTarget = 0
  let totalConverted = 0
  campaigns.forEach(c => {
    if (c.stats) {
      totalTarget += c.stats.total || 0
      totalConverted += c.stats.converted || 0
    }
  })
  const globalConversionRate = totalTarget > 0 ? ((totalConverted / totalTarget) * 100).toFixed(2) : 0

  const kpis = { totalRevenue, totalOrders, aov, globalConversionRate }

  // 2. Revenue Over Time (Daily)
  const revenueMap: Record<string, number> = {}
  ;(orders || []).forEach(o => {
    const day = format(parseISO(o.createdAt), 'MMM dd')
    revenueMap[day] = (revenueMap[day] || 0) + o.amount
  })
  const revenueOverTime = Object.keys(revenueMap).map(date => ({
    date,
    revenue: revenueMap[date]
  }))

  // 3. Channel Performance
  const channelMap: Record<string, { sent: number, opened: number, converted: number, revenue: number }> = {}
  campaigns.forEach(c => {
    const ch = c.channel
    if (!channelMap[ch]) channelMap[ch] = { sent: 0, opened: 0, converted: 0, revenue: 0 }
    if (c.stats) {
      channelMap[ch].sent += c.stats.sent || 0
      channelMap[ch].opened += c.stats.opened || 0
      channelMap[ch].converted += c.stats.converted || 0
      channelMap[ch].revenue += c.stats.revenue || 0
    }
  })
  
  const channelPerformance = Object.keys(channelMap).map(channel => ({
    name: channel,
    ...channelMap[channel],
    conversionRate: channelMap[channel].sent > 0 
      ? ((channelMap[channel].converted / channelMap[channel].sent) * 100).toFixed(1) 
      : 0
  }))

  // 4. Top Campaigns
  const topCampaigns = [...campaigns]
    .sort((a, b) => (b.stats?.revenue || 0) - (a.stats?.revenue || 0))
    .slice(0, 5)
    .map(c => ({
      id: c.id,
      name: c.name,
      channel: c.channel,
      revenue: c.stats?.revenue || 0,
      converted: c.stats?.converted || 0,
      target: c.stats?.total || 0
    }))

  // 5. Funnel (Aggregate)
  let totalDelivered = 0
  let totalOpened = 0
  campaigns.forEach(c => {
    if (c.stats) {
      totalDelivered += c.stats.delivered || 0
      totalOpened += c.stats.opened || 0
    }
  })
  const funnel = [
    { name: 'Targeted', value: totalTarget },
    { name: 'Delivered', value: totalDelivered },
    { name: 'Opened', value: totalOpened },
    { name: 'Converted', value: totalConverted },
  ]

  // Revenue By Campaign (for the bar chart)
  const revenueByCampaign = campaigns
    .filter(c => (c.stats?.revenue || 0) > 0)
    .map(c => ({
      name: c.name,
      revenue: c.stats?.revenue || 0
    }))

  res.json({
    kpis,
    revenueOverTime,
    channelPerformance,
    topCampaigns,
    funnel,
    revenueByCampaign
  })
}))

export default router
