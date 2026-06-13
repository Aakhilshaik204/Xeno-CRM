import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { supabase, generateId } from '../lib/supabase'

const router = Router()

// ── GET /api/campaigns ────────────────────────────────────────────────────────
router.get('/', asyncHandler(async (_req, res) => {
  const { data: campaigns, error } = await supabase
    .from('Campaign')
    .select('*, stats:CampaignStats(*), segment:Segment(name, customerCount)')
    .order('createdAt', { ascending: false })

  if (error) {
    res.status(500).json({ error: error.message }); return
  }

  // Format stats from array (PostgREST) to object (expected by frontend)
  const formattedCampaigns = campaigns?.map((c: any) => ({
    ...c,
    stats: Array.isArray(c.stats) ? c.stats[0] || null : c.stats,
    segment: Array.isArray(c.segment) ? c.segment[0] || null : c.segment
  }))

  res.json({ campaigns: formattedCampaigns })
}))

// ── GET /api/campaigns/:id ────────────────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const { data: campaign, error: campaignErr } = await supabase
    .from('Campaign')
    .select('*, stats:CampaignStats(*), segment:Segment(*)')
    .eq('id', id)
    .single()

  if (campaignErr || !campaign) {
    res.status(404).json({ error: 'Campaign not found' }); return
  }

  // Format arrays to objects
  const formattedCampaign = {
    ...campaign,
    stats: Array.isArray(campaign.stats) ? campaign.stats[0] || null : campaign.stats,
    segment: Array.isArray(campaign.segment) ? campaign.segment[0] || null : campaign.segment
  }

  const { data: recentCommunications, error: commErr } = await supabase
    .from('Communication')
    .select('*, customer:Customer(name, email, phone)')
    .eq('campaignId', id)
    .order('queuedAt', { ascending: false })
    .limit(1000)

  if (commErr) {
    res.status(500).json({ error: commErr.message }); return
  }

  const formattedComms = recentCommunications?.map((c: any) => ({
    ...c,
    customer: Array.isArray(c.customer) ? c.customer[0] || null : c.customer
  }))

  res.json({ campaign: formattedCampaign, recentCommunications: formattedComms })
}))

// ── POST /api/campaigns ───────────────────────────────────────────────────────
// Creates a new campaign. Supports:
//   - segmentId: use an existing segment
//   - customerIds: auto-create a "Custom: <name>" segment
//   - scheduledAt: set status to 'scheduled'
router.post('/', asyncHandler(async (req, res) => {
  const { name, channel, messageTemplate, segmentId, customerIds, scheduledAt } = req.body

  if (!name || !channel || !messageTemplate) {
    res.status(400).json({ error: 'name, channel, and messageTemplate are required' }); return
  }
  if (!segmentId && (!customerIds || customerIds.length === 0)) {
    res.status(400).json({ error: 'Either segmentId or customerIds must be provided' }); return
  }

  let targetSegmentId = segmentId

  // Auto-create segment from individual customer selection
  if (customerIds && customerIds.length > 0) {
    const { data: autoSegment } = await supabase.from('Segment').insert({
      id: generateId(),
      name: `Custom: ${name}`,
      description: `Auto-created from manual customer selection for campaign "${name}"`,
      filterConfig: [{ field: 'id', operator: 'in', value: customerIds }],
      customerCount: customerIds.length,
      createdBy: 'custom',
      updatedAt: new Date().toISOString()
    }).select().single()
    if (autoSegment) {
      targetSegmentId = autoSegment.id
    }
  }

  const status = scheduledAt ? 'scheduled' : 'draft'

  const { data: rawCampaign, error } = await supabase.from('Campaign').insert({
    id: generateId(),
    name,
    channel,
    messageTemplate,
    segmentId: targetSegmentId,
    status,
    scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
  }).select('*, segment:Segment(name, customerCount)').single()

  if (error) console.error('Error inserting campaign:', error)

  let campaignStats = null
  if (rawCampaign) {
    const { data: stats } = await supabase.from('CampaignStats').insert({
      id: generateId(),
      campaignId: rawCampaign.id,
      total: Array.isArray(rawCampaign.segment) ? (rawCampaign.segment[0]?.customerCount || 0) : (rawCampaign.segment?.customerCount || 0)
    }).select().single()
    campaignStats = stats
  }

  const campaign = rawCampaign ? {
    ...rawCampaign,
    segment: Array.isArray(rawCampaign.segment) ? rawCampaign.segment[0] || null : rawCampaign.segment,
    stats: campaignStats
  } : null

  res.status(201).json({ campaign })
}))

// ── PUT /api/campaigns/:id ────────────────────────────────────────────────────
// Updates a draft or scheduled campaign.
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const { name, channel, messageTemplate, segmentId, customerIds, scheduledAt } = req.body

  const { data: rawExisting } = await supabase.from('Campaign').select('*, segment:Segment(*)').eq('id', id).single()
  
  if (!rawExisting) { res.status(404).json({ error: 'Campaign not found' }); return }
  if (!['draft', 'scheduled'].includes(rawExisting.status)) {
    res.status(400).json({ error: 'Only draft or scheduled campaigns can be edited' }); return
  }

  const existingSegment = Array.isArray(rawExisting.segment) ? rawExisting.segment[0] || null : rawExisting.segment
  let targetSegmentId = segmentId || rawExisting.segmentId

  // If new customerIds provided — delete old custom segment, create new one
  if (customerIds && customerIds.length > 0) {
    if (existingSegment?.createdBy === 'custom') {
      await supabase.from('Segment').delete().eq('id', rawExisting.segmentId)
    }
    const { data: autoSegment } = await supabase.from('Segment').insert({
      id: generateId(),
      name: `Custom: ${name || rawExisting.name}`,
      description: `Auto-created from manual customer selection for campaign "${name || rawExisting.name}"`,
      filterConfig: [{ field: 'id', operator: 'in', value: customerIds }],
      customerCount: customerIds.length,
      createdBy: 'custom',
      updatedAt: new Date().toISOString()
    }).select().single()
    if (autoSegment) {
      targetSegmentId = autoSegment.id
    }
  }

  const newStatus = scheduledAt ? 'scheduled' : 'draft'

  const { data: rawCampaign } = await supabase.from('Campaign').update({
    name: name || rawExisting.name,
    channel: channel || rawExisting.channel,
    messageTemplate: messageTemplate || rawExisting.messageTemplate,
    segmentId: targetSegmentId,
    scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    status: newStatus,
  }).eq('id', id).select('*, segment:Segment(name, customerCount)').single()

  const campaign = rawCampaign ? {
    ...rawCampaign,
    segment: Array.isArray(rawCampaign.segment) ? rawCampaign.segment[0] || null : rawCampaign.segment
  } : null

  res.json({ campaign })
}))

// ── DELETE /api/campaigns/:id ─────────────────────────────────────────────────
// Deletes a draft or scheduled campaign (and its custom segment if applicable).
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params

  const { data: rawExisting } = await supabase.from('Campaign').select('*, segment:Segment(*)').eq('id', id).single()
  if (!rawExisting) { res.status(404).json({ error: 'Campaign not found' }); return }

  // Delete related CampaignStats if it exists
  const { error: statsError } = await supabase.from('CampaignStats').delete().eq('campaignId', id)
  if (statsError) { res.status(500).json({ error: statsError.message }); return }

  // Delete related Communications
  const { error: commsError } = await supabase.from('Communication').delete().eq('campaignId', id)
  if (commsError) { res.status(500).json({ error: commsError.message }); return }

  // Delete campaign
  const { error: campError } = await supabase.from('Campaign').delete().eq('id', id)
  if (campError) { res.status(500).json({ error: campError.message }); return }

  // Clean up auto-created custom segment
  const existingSegment = Array.isArray(rawExisting.segment) ? rawExisting.segment[0] || null : rawExisting.segment
  if (existingSegment?.createdBy === 'custom') {
    await supabase.from('Segment').delete().eq('id', rawExisting.segmentId)
  }

  res.json({ success: true })
}))

// ── POST /api/campaigns/:id/dispatch ─────────────────────────────────────────
import { dispatchCampaign } from '../services/dispatcher'

router.post('/:id/dispatch', asyncHandler(async (req, res) => {
  const { id } = req.params
  await supabase.from('Campaign').update({ status: 'sending', scheduledAt: null }).eq('id', id)
  dispatchCampaign(id)
  res.json({ success: true, status: 'sending' })
}))

export default router
