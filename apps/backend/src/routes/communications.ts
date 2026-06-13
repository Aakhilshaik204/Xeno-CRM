import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { supabase } from '../lib/supabase'

const router = Router()

// GET /api/communications
// Returns a global feed of recent communications
router.get('/', asyncHandler(async (req, res) => {
  const { data: rawCommunications } = await supabase
    .from('Communication')
    .select('*, customer:Customer(name, email), campaign:Campaign(name)')
    .order('queuedAt', { ascending: false })
    .limit(100)
    
  const communications = (rawCommunications || []).map((c: any) => ({
    ...c,
    customer: Array.isArray(c.customer) ? c.customer[0] || null : c.customer,
    campaign: Array.isArray(c.campaign) ? c.campaign[0] || null : c.campaign
  }))
  
  res.json({ communications })
}))

export default router
