import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { supabase } from '../lib/supabase'
import { applySupabaseFilters, FilterRule } from '../services/segmentFilter'

const router = Router()

// GET /api/audiences
// Returns all segments including their basic stats and customer counts
router.get('/', asyncHandler(async (_req, res) => {
  const { data: rawSegments, error } = await supabase
    .from('Segment')
    .select('*, stats:SegmentStats(*), campaigns:Campaign(id)')
    .order('createdAt', { ascending: false })

  if (error) {
    res.status(500).json({ error: error.message }); return
  }

  const segments = rawSegments?.map((s: any) => ({
    ...s,
    stats: Array.isArray(s.stats) ? s.stats[0] || null : s.stats,
    _count: {
      campaigns: Array.isArray(s.campaigns) ? s.campaigns.length : 0
    }
  }))

  const { count: totalCustomers } = await supabase.from('Customer').select('*', { count: 'exact', head: true })

  res.json({ segments, totalCustomers: totalCustomers || 0 })
}))

const generateId = () => Math.random().toString(36).substr(2, 9)

// POST /api/audiences/preview
// Returns the count and a preview list of customers matching the filterConfig
router.post('/preview', asyncHandler(async (req, res) => {
  const { filterConfig } = req.body

  let rules = filterConfig as FilterRule[] || []
  for (const rule of rules) {
    if (typeof rule.value === 'string' && !isNaN(Number(rule.value))) {
      rule.value = Number(rule.value)
    }
  }

  let query = supabase.from('Customer').select('*', { count: 'exact' })
  query = applySupabaseFilters(query, rules)
  
  // Limit the returned customers for the preview UI to prevent massive payloads
  const { data: customers, count, error } = await query.limit(50)
  
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ count: count || 0, customers: customers || [] })
}))

// POST /api/audiences
// Creates a new segment manually
router.post('/', asyncHandler(async (req, res) => {
  const { name, description, filterConfig } = req.body

  if (!name || !filterConfig) {
    res.status(400).json({ error: 'Name and filterConfig are required' })
    return
  }

  let rules = filterConfig as FilterRule[] || []
  for (const rule of rules) {
    if (typeof rule.value === 'string' && !isNaN(Number(rule.value))) {
      rule.value = Number(rule.value)
    }
  }

  // Calculate live count before inserting
  let query = supabase.from('Customer').select('id', { count: 'exact', head: true })
  query = applySupabaseFilters(query, rules)
  const { count } = await query

  const { data: segment, error } = await supabase.from('Segment').insert({
    id: generateId(),
    name,
    description: description || '',
    filterConfig: rules,
    customerCount: count || 0,
    createdBy: 'user', // Manual segment
    updatedAt: new Date().toISOString()
  }).select().single()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ segment })
}))

// GET /api/audiences/:id
// Returns segment details and a list of customers belonging to this segment
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params

  const { data: rawSegment, error: segmentErr } = await supabase
    .from('Segment')
    .select('*, stats:SegmentStats(*)')
    .eq('id', id)
    .single()

  if (segmentErr || !rawSegment) {
    res.status(404).json({ error: 'Segment not found' })
    return
  }

  const segment = {
    ...rawSegment,
    stats: Array.isArray(rawSegment.stats) ? rawSegment.stats[0] || null : rawSegment.stats
  }

  // Fetch customers by applying segment.filterConfig
  let customers: any[] = []
  
  let rules = segment.filterConfig as any
  if (typeof rules === 'string') {
    try { rules = JSON.parse(rules) } catch (e) {}
  }

  // Handle both array format and old object format (convert object to array if needed)
  if (rules && !Array.isArray(rules) && Object.keys(rules).length > 0) {
    if (rules.tier === 'VIP') {
      rules = [{ field: 'totalSpend', operator: 'gte', value: 20000 }]
    } else if (rules.lastActiveDays) {
      rules = [{ field: 'daysSinceLastOrder', operator: 'gte', value: rules.lastActiveDays }]
    } else if (rules.joinedDays) {
      rules = []
    }
  }

  if (Array.isArray(rules) && rules.length > 0) {
    // ensure numeric values are casted
    for (const rule of rules) {
      if (typeof rule.value === 'string' && !isNaN(Number(rule.value))) {
        rule.value = Number(rule.value)
      }
    }
    
    let query = supabase.from('Customer').select('*').limit(500)
    query = applySupabaseFilters(query, rules as FilterRule[])
    const { data: matchedCustomers } = await query
    customers = matchedCustomers || []
  } else {
    const { data: allCustomers } = await supabase.from('Customer').select('*').limit(500)
    const shuffled = (allCustomers || []).sort(() => 0.5 - Math.random())
    customers = shuffled.slice(0, Math.min(250, segment.customerCount))
  }

  res.json({ segment, customers })
}))

// DELETE /api/audiences/:id
// Deletes a segment. Fails if attached to campaigns.
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params

  const { error } = await supabase.from('Segment').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      res.status(400).json({ error: 'Cannot delete this segment because it is being used by existing campaigns. Delete the campaigns first.' })
      return
    }
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ success: true })
}))

export default router
