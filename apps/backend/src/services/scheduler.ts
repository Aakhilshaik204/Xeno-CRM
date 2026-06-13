import { supabase } from '../lib/supabase'
import { dispatchCampaign } from './dispatcher'

/**
 * Checks every 60 seconds for campaigns that are scheduled and due.
 * Fires the dispatcher for each one automatically.
 * Uses Supabase REST API to avoid connection pool issues.
 */
export function startScheduler() {
  console.log('⏱  Campaign scheduler started (checking every 60s)')

  setInterval(async () => {
    try {
      const { data: due, error } = await supabase
        .from('Campaign')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduledAt', new Date().toISOString())

      if (error) {
        console.error('Scheduler fetch error:', error)
        return
      }

      if (!due || due.length === 0) return

      console.log(`⏱  Scheduler: ${due.length} campaign(s) due — dispatching...`)

      for (const campaign of due) {
        const { error: updateError } = await supabase
          .from('Campaign')
          .update({ status: 'sending' })
          .eq('id', campaign.id)

        if (updateError) {
          console.error(`Failed to update campaign ${campaign.id}:`, updateError)
          continue
        }

        dispatchCampaign(campaign.id)
        console.log(`  ✓ Dispatched scheduled campaign: ${campaign.name} (${campaign.id})`)
      }
    } catch (err) {
      console.error('Scheduler unexpected error:', err)
    }
  }, 60_000)
}
