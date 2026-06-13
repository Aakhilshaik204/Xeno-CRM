import axios from 'axios'
import PQueue from 'p-queue'
import { supabase, generateId } from '../lib/supabase'
import { applySupabaseFilters, FilterRule } from './segmentFilter'
import { SendPayload, Channel } from '@xenocrm/shared-types'

// Rate limit to Channel Service (e.g. max 50 req per second)
const dispatchQueue = new PQueue({ concurrency: 10, intervalCap: 50, interval: 1000 })
const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3002'

export async function dispatchCampaign(campaignId: string) {
  console.log(`🚀 Starting dispatch for campaign ${campaignId}`)

  try {
    const { data: rawCampaign } = await supabase.from('Campaign').select('*, segment:Segment(*)').eq('id', campaignId).single()
    const campaign = rawCampaign ? {
      ...rawCampaign,
      segment: Array.isArray(rawCampaign.segment) ? rawCampaign.segment[0] || null : rawCampaign.segment
    } : null

    if (!campaign) throw new Error('Campaign not found')
    if (campaign.status !== 'sending') {
      console.log(`Campaign ${campaignId} is not in 'sending' status (current: ${campaign.status}). Aborting dispatch.`)
      return
    }

    let filterRules = campaign.segment?.filterConfig as unknown as FilterRule[]
    if (typeof filterRules === 'string') {
        try { filterRules = JSON.parse(filterRules) } catch(e){}
    }
    
    // Count total audience size
    let countQuery = supabase.from('Customer').select('*', { count: 'exact', head: true })
    countQuery = applySupabaseFilters(countQuery, filterRules)
    const { count: audienceCount } = await countQuery

    const { data: existingStats } = await supabase.from('CampaignStats').select('id').eq('campaignId', campaignId).maybeSingle()
    if (existingStats) {
      await supabase.from('CampaignStats').update({ total: audienceCount || 0 }).eq('id', existingStats.id)
    } else {
      await supabase.from('CampaignStats').insert({ id: generateId(), campaignId, total: audienceCount || 0 })
    }

    // Pagination to avoid OOM
    const BATCH_SIZE = 500
    let cursor: string | undefined = undefined
    let hasMore = true
    let totalProcessed = 0

    while (hasMore) {
      let q = supabase.from('Customer').select('*').limit(BATCH_SIZE).order('id', { ascending: true })
      if (cursor) {
        q = q.gt('id', cursor)
      }
      q = applySupabaseFilters(q, filterRules)
      const { data: customers } = await q

      if (!customers || customers.length === 0) {
        hasMore = false
        break
      }

      cursor = customers[customers.length - 1].id

      for (const customer of customers) {
        dispatchQueue.add(async () => {
          // 1. Create Communication record
          const { data: comm } = await supabase.from('Communication').insert({
            id: generateId(),
            campaignId: campaign.id,
            customerId: customer.id,
            channel: campaign.channel,
            message: campaign.messageTemplate.replace('{{name}}', customer.name.split(' ')[0]),
            status: 'queued',
            queuedAt: new Date().toISOString()
          }).select().single()
          
          if (!comm) return

          // 2. Send to Channel Service
          const payload: SendPayload = {
            commId: comm.id,
            campaignId: campaign.id,
            channel: campaign.channel as Channel,
            message: comm.message,
            recipient: {
              id: customer.id,
              phone: customer.phone,
              email: customer.email,
              name: customer.name
            }
          }

          try {
            await axios.post(`${CHANNEL_SERVICE_URL}/send`, payload, { timeout: 5000 })
          } catch (e: any) {
            console.error(`Failed to dispatch comm ${comm.id} to channel service:`, e.message)
            await supabase.from('Communication').update({
              status: 'failed', failedAt: new Date().toISOString(), metadata: { error: 'Channel service unreachable' }
            }).eq('id', comm.id)
            
            const { data: stats } = await supabase.from('CampaignStats').select('id, failed').eq('campaignId', campaign.id).maybeSingle()
            if (stats) {
               await supabase.from('CampaignStats').update({ failed: (stats.failed || 0) + 1 }).eq('id', stats.id)
            } else {
               await supabase.from('CampaignStats').insert({ id: generateId(), campaignId: campaign.id, failed: 1 })
            }
          }
        })
      }
      
      totalProcessed += customers.length
    }

    // Wait for all jobs to finish queueing/dispatching
    await dispatchQueue.onIdle()

    // Mark campaign as sent
    await supabase.from('Campaign').update({ status: 'sent' }).eq('id', campaignId)
    
    console.log(`✅ Finished dispatching campaign ${campaignId}. Total processed: ${totalProcessed}`)

  } catch (error) {
    console.error(`Error dispatching campaign ${campaignId}:`, error)
  }
}
