import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { supabase } from '../lib/supabase'

const router = Router()

// GET /api/customers — list for individual customer picker
router.get('/', asyncHandler(async (_req, res) => {
  const { data: customers } = await supabase
    .from('Customer')
    .select('id, name, email, city, membershipTier, totalSpend, orderCount')
    .order('totalSpend', { ascending: false })
    
  res.json({ customers })
}))

// GET /api/customers/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params

  const { data: rawCustomer } = await supabase
    .from('Customer')
    .select('*, orders:Order(*), communications:Communication(*, campaign:Campaign(id, name, channel))')
    .eq('id', id)
    .single()

  const customer = rawCustomer ? {
    ...rawCustomer,
    orders: Array.isArray(rawCustomer.orders) ? rawCustomer.orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20) : [],
    communications: Array.isArray(rawCustomer.communications) ? rawCustomer.communications.map((c: any) => ({
      ...c,
      campaign: Array.isArray(c.campaign) ? c.campaign[0] || null : c.campaign
    })).sort((a: any, b: any) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime()).slice(0, 20) : []
  } : null

  if (!customer) {
    res.status(404).json({ error: 'Customer not found' })
    return
  }

  res.json({ customer })
}))

export default router
