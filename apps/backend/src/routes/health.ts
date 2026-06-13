import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { supabase } from '../lib/supabase'

const router = Router()

// ── Health Score Calculator ───────────────────────────────────────────────────
// Scores a customer 0-100 based on 4 signals from existing data.
function computeHealthScore(customer: any, allOrders: any[], allComms: any[], tierAvgOrderCount: Record<string, number>) {
  const now = Date.now()

  // ── 1. Recency (35 pts) ──────────────────────────────────────────────────
  let recencyScore = 0
  const lastOrderDate = customer.lastOrderDate ? new Date(customer.lastOrderDate).getTime() : null
  if (lastOrderDate) {
    const daysSince = (now - lastOrderDate) / 86400000
    if (daysSince <= 30) recencyScore = 35
    else if (daysSince <= 60) recencyScore = 28
    else if (daysSince <= 90) recencyScore = 20
    else if (daysSince <= 120) recencyScore = 12
    else if (daysSince <= 180) recencyScore = 5
    else recencyScore = 0
  }

  // ── 2. Engagement (30 pts) ───────────────────────────────────────────────
  let engagementScore = 0
  const threeMonthsAgo = now - (90 * 86400000)
  const recentComms = allComms.filter(
    c => c.customerId === customer.id && new Date(c.queuedAt || c.createdAt).getTime() > threeMonthsAgo
  )
  if (recentComms.length > 0) {
    const engaged = recentComms.filter(c => ['opened', 'clicked', 'converted'].includes(c.status)).length
    const rate = engaged / recentComms.length
    engagementScore = Math.round(rate * 30)
  } else {
    // No recent comms — neutral (not penalised, not rewarded)
    engagementScore = 12
  }

  // ── 3. Spend Trajectory (20 pts) ─────────────────────────────────────────
  let spendScore = 0
  const custOrders = allOrders
    .filter(o => o.customerId === customer.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  if (custOrders.length >= 2) {
    const half = Math.floor(custOrders.length / 2)
    const firstHalfAvg = custOrders.slice(0, half).reduce((s, o) => s + o.amount, 0) / half
    const secondHalfAvg = custOrders.slice(half).reduce((s, o) => s + o.amount, 0) / (custOrders.length - half)
    const trend = (secondHalfAvg - firstHalfAvg) / (firstHalfAvg || 1)
    if (trend >= 0.1) spendScore = 20      // growing
    else if (trend >= -0.1) spendScore = 15 // stable
    else if (trend >= -0.3) spendScore = 8  // slightly declining
    else spendScore = 3                    // significantly declining
  } else if (custOrders.length === 1) {
    spendScore = 12 // new buyer, neutral
  } else {
    spendScore = 0 // never ordered
  }

  // ── 4. Frequency (15 pts) ─────────────────────────────────────────────────
  let frequencyScore = 0
  const tier = customer.membershipTier || 'None'
  const avgForTier = tierAvgOrderCount[tier] || 1
  const ratio = customer.orderCount / avgForTier
  if (ratio >= 1.5) frequencyScore = 15
  else if (ratio >= 1.0) frequencyScore = 12
  else if (ratio >= 0.6) frequencyScore = 8
  else if (ratio >= 0.3) frequencyScore = 4
  else frequencyScore = 1

  const total = recencyScore + engagementScore + spendScore + frequencyScore
  const zone = total >= 70 ? 'healthy' : total >= 40 ? 'at_risk' : 'churning'

  return {
    score: total,
    zone,
    breakdown: {
      recency: { score: recencyScore, max: 35 },
      engagement: { score: engagementScore, max: 30 },
      spendTrajectory: { score: spendScore, max: 20 },
      frequency: { score: frequencyScore, max: 15 },
    }
  }
}

// ── Helper: compute tier avg order count ────────────────────────────────────
function getTierAvgOrderCounts(customers: any[]): Record<string, number> {
  const tierCounts: Record<string, { total: number; count: number }> = {}
  for (const c of customers) {
    const t = c.membershipTier || 'None'
    if (!tierCounts[t]) tierCounts[t] = { total: 0, count: 0 }
    tierCounts[t].total += c.orderCount || 0
    tierCounts[t].count += 1
  }
  const result: Record<string, number> = {}
  for (const t in tierCounts) {
    result[t] = tierCounts[t].count > 0 ? tierCounts[t].total / tierCounts[t].count : 1
  }
  return result
}

// ── GET /api/health/overview ─────────────────────────────────────────────────
router.get('/overview', asyncHandler(async (_req, res) => {
  const [{ data: customers }, { data: orders }, { data: comms }] = await Promise.all([
    supabase.from('Customer').select('id, name, email, membershipTier, totalSpend, orderCount, lastOrderDate').limit(300),
    supabase.from('Order').select('customerId, amount, createdAt'),
    supabase.from('Communication').select('customerId, status, queuedAt, createdAt'),
  ])

  const allCustomers = customers || []
  const allOrders = orders || []
  const allComms = comms || []
  const tierAvg = getTierAvgOrderCounts(allCustomers)

  let healthy = 0, atRisk = 0, churning = 0, totalScore = 0
  for (const c of allCustomers) {
    const { score, zone } = computeHealthScore(c, allOrders, allComms, tierAvg)
    totalScore += score
    if (zone === 'healthy') healthy++
    else if (zone === 'at_risk') atRisk++
    else churning++
  }

  res.json({
    healthy,
    atRisk,
    churning,
    avgScore: allCustomers.length > 0 ? Math.round(totalScore / allCustomers.length) : 0,
    total: allCustomers.length,
  })
}))

// ── GET /api/health/alerts ───────────────────────────────────────────────────
router.get('/alerts', asyncHandler(async (_req, res) => {
  const limit = 20

  const [{ data: customers }, { data: orders }, { data: comms }] = await Promise.all([
    supabase.from('Customer').select('id, name, email, membershipTier, totalSpend, orderCount, lastOrderDate').limit(300),
    supabase.from('Order').select('customerId, amount, createdAt'),
    supabase.from('Communication').select('customerId, status, queuedAt, createdAt'),
  ])

  const allCustomers = customers || []
  const allOrders = orders || []
  const allComms = comms || []
  const tierAvg = getTierAvgOrderCounts(allCustomers)

  const scored = allCustomers.map(c => ({
    ...c,
    health: computeHealthScore(c, allOrders, allComms, tierAvg)
  }))

  // Return only at-risk and churning, sorted by score ascending (worst first)
  const alerts = scored
    .filter(c => c.health.score < 60)
    .sort((a, b) => a.health.score - b.health.score)
    .slice(0, limit)
    .map(c => {
      const daysSince = c.lastOrderDate
        ? Math.floor((Date.now() - new Date(c.lastOrderDate).getTime()) / 86400000)
        : null

      // Generate a contextual recommended action
      let action = 'Send a personalised win-back offer'
      if (!c.lastOrderDate) action = 'Send a first-purchase incentive'
      else if (daysSince && daysSince > 120) action = 'Send a "We miss you" reactivation campaign'
      else if (c.health.breakdown.engagement.score < 8) action = 'Re-engage with a targeted email campaign'
      else if (c.health.breakdown.spendTrajectory.score < 8) action = 'Offer a loyalty reward to boost spend'

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        membershipTier: c.membershipTier,
        totalSpend: c.totalSpend,
        orderCount: c.orderCount,
        lastOrderDate: c.lastOrderDate,
        daysSinceOrder: daysSince,
        health: c.health,
        recommendedAction: action,
      }
    })

  res.json({ alerts })
}))

// ── GET /api/health/customer/:id ─────────────────────────────────────────────
router.get('/customer/:id', asyncHandler(async (req, res) => {
  const { id } = req.params

  const [{ data: customer }, { data: allCustomers }, { data: orders }, { data: comms }] = await Promise.all([
    supabase.from('Customer').select('id, name, email, membershipTier, totalSpend, orderCount, lastOrderDate').eq('id', id).single(),
    supabase.from('Customer').select('id, membershipTier, orderCount'),
    supabase.from('Order').select('customerId, amount, createdAt').eq('customerId', id),
    supabase.from('Communication').select('customerId, status, queuedAt, createdAt').eq('customerId', id),
  ])

  if (!customer) {
    res.status(404).json({ error: 'Customer not found' })
    return
  }

  const tierAvg = getTierAvgOrderCounts(allCustomers || [])
  const health = computeHealthScore(customer, orders || [], comms || [], tierAvg)

  res.json({ health })
}))

export default router
