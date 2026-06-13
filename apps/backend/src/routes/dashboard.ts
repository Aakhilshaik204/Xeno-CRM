import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { supabase } from '../lib/supabase'

const router = Router()

router.get('/', asyncHandler(async (_req, res) => {
  const [campRes, custRes, ordRes, tiersRes] = await Promise.all([
    supabase.from('Campaign').select('*, stats:CampaignStats(*), segment:Segment(*)').order('createdAt', { ascending: false }),
    supabase.from('Customer').select('id', { count: 'exact', head: true }),
    supabase.from('Order').select('id', { count: 'exact', head: true }),
    supabase.from('Customer').select('membershipTier'),
  ])

  const campaigns = (campRes.data || []).map((c: any) => ({
    ...c,
    stats: Array.isArray(c.stats) ? c.stats[0] || null : c.stats,
    segment: Array.isArray(c.segment) ? c.segment[0] || null : c.segment
  }))
  const totalCustomers = custRes.count || 0
  const totalOrders = ordRes.count || 0

  // Group tiers in JS
  const tierCounts: Record<string, number> = {}
  ;(tiersRes.data || []).forEach((c: any) => {
    const t = c.membershipTier || 'None'
    tierCounts[t] = (tierCounts[t] || 0) + 1
  })

  const totalRev    = campaigns.reduce((s: number, c: any) => s + (c.stats?.revenue   || 0), 0)
  const totalConv   = campaigns.reduce((s: number, c: any) => s + (c.stats?.converted || 0), 0)
  const totalSent   = campaigns.reduce((s: number, c: any) => s + (c.stats?.total     || 0), 0)
  const totalDel    = campaigns.reduce((s: number, c: any) => s + (c.stats?.delivered || 0), 0)
  const totalOpened = campaigns.reduce((s: number, c: any) => s + (c.stats?.opened    || 0), 0)
  const totalClicked= campaigns.reduce((s: number, c: any) => s + (c.stats?.clicked   || 0), 0)

  const avgDeliveryRate = totalSent   > 0 ? +((totalDel    / totalSent)   * 100).toFixed(1) : 0
  const avgOpenRate     = totalDel    > 0 ? +((totalOpened / totalDel)    * 100).toFixed(1) : 0
  const avgClickRate    = totalOpened > 0 ? +((totalClicked/ totalOpened) * 100).toFixed(1) : 0

  // Channels used
  const channelMap: Record<string, number> = {}
  campaigns.forEach((c: any) => { channelMap[c.channel] = (channelMap[c.channel] || 0) + 1 })
  const channelsUsed = Object.entries(channelMap).map(([name, count]) => ({ name, count }))

  // Campaign reach per campaign (for bar chart) - last 8
  const campaignReach = campaigns.slice(0, 8).reverse().map((c: any) => ({
    name: c.name.length > 16 ? c.name.slice(0, 16) + '…' : c.name,
    reach:     c.stats?.total     || 0,
    delivered: c.stats?.delivered || 0,
    converted: c.stats?.converted || 0,
  }))

  // Customer tier distribution
  const tierOrder = ['Platinum', 'Gold', 'Silver', 'Bronze', 'None']
  const tiers = tierOrder
    .map(t => ({ name: t, value: tierCounts[t] || 0 }))
    .filter(t => t.value > 0)

  // Recent campaigns
  const recentCampaigns = campaigns.slice(0, 5).map((c: any) => ({
    id: c.id, name: c.name, status: c.status, channel: c.channel,
    segmentName: c.segment?.name || 'Unknown',
    revenue: c.stats?.revenue || 0,
    reach: c.stats?.total || 0,
    createdAt: c.createdAt,
  }))

  res.json({
    metrics: {
      totalCustomers,
      totalOrders,
      campaigns: campaigns.length,
      revenue: totalRev,
      conversions: totalConv,
      campaignReach: totalSent,
      avgDeliveryRate,
      avgOpenRate,
      avgClickRate,
    },
    channelsUsed,
    campaignReach,
    customerTiers: tiers,
    recentCampaigns,
  })
}))

export default router
