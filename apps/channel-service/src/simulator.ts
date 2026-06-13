import { Channel, SendPayload } from '@xenocrm/shared-types'
import { fireCallback } from './queue'

// Helpers
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

// Simulated probabilities based on channel
const CHANNEL_STATS: Record<Channel, { openRate: number, clickRate: number }> = {
  whatsapp: { openRate: 0.95, clickRate: 0.85 },
  sms: { openRate: 0.90, clickRate: 0.80 },
  email: { openRate: 0.85, clickRate: 0.70 },
  rcs: { openRate: 0.95, clickRate: 0.85 }
}

const FAILURE_REASONS = [
  { reason: 'invalid_number', weight: 40, message: 'The phone number or email is invalid' },
  { reason: 'opted_out', weight: 20, message: 'User has opted out of communications' },
  { reason: 'network_timeout', weight: 20, message: 'Delivery timed out' },
  { reason: 'rate_limited', weight: 10, message: 'Provider rate limit exceeded' },
  { reason: 'carrier_rejected', weight: 10, message: 'Carrier rejected the message' }
]

function getRandomFailureReason() {
  const roll = Math.random() * 100
  let cumulative = 0
  for (const f of FAILURE_REASONS) {
    cumulative += f.weight
    if (roll <= cumulative) return { failureReason: f.reason, failureMessage: f.message }
  }
  return { failureReason: 'unknown', failureMessage: 'Unknown error' }
}

export async function processJob(job: SendPayload) {
  const { commId, channel, recipient } = job
  
  // 1. Sent (immediate acknowledgment from provider)
  console.log(`\n[Simulator] 📤 SENDING (${channel}) to ${recipient.name} [ID: ${commId}]`)
  await fireCallback(commId, 'sent', channel)

  // 2. Failure vs Delivery (probabilistic, simulating network delays)
  // Overall 5% failure rate for simulation
  const isFailure = Math.random() < 0.05
  await sleep(randomBetween(500, 1500))

  if (isFailure) {
    const errorData = getRandomFailureReason()
    console.log(`[Simulator] ❌ FAILED (${channel}) for ${recipient.name} - Reason: ${errorData.failureReason}`)
    await fireCallback(commId, 'failed', channel, errorData)
    return // Terminal state
  }

  // 3. Delivered
  console.log(`[Simulator] 📬 DELIVERED (${channel}) to ${recipient.name}`)
  await fireCallback(commId, 'delivered', channel)

  // 4. Opened (probabilistic, simulating user behavior)
  const stats = CHANNEL_STATS[channel]
  if (Math.random() > stats.openRate) return // User ignored it
  
  // Delay before opening
  await sleep(randomBetween(1000, 3000))
  console.log(`[Simulator] 👀 OPENED (${channel}) by ${recipient.name}`)
  await fireCallback(commId, 'opened', channel)

  // 5. Read (probabilistic)
  // Assume 95% of opened messages are actually read
  if (Math.random() > 0.95) return
  await sleep(randomBetween(500, 1500))
  console.log(`[Simulator] 📖 READ (${channel}) by ${recipient.name}`)
  await fireCallback(commId, 'read', channel)

  // 6. Clicked (probabilistic)
  if (Math.random() > stats.clickRate) return
  await sleep(randomBetween(1000, 2000))
  console.log(`[Simulator] 🖱️  CLICKED (${channel}) by ${recipient.name}`)
  await fireCallback(commId, 'clicked', channel, { clickUrl: 'https://maison.luxe/offer' })

  // 7. Converted (probabilistic)
  // 90% of clicks convert to make it exciting for the user
  if (Math.random() < 0.90) {
    await sleep(randomBetween(2000, 5000))
    const revenue = randomBetween(1000, 15000)
    console.log(`[Simulator] 💰 CONVERTED! ${recipient.name} placed an order for ₹${revenue}`)
    await fireCallback(commId, 'converted', channel, { 
      orderId: `ORD-${Date.now()}-${recipient.id.substring(0, 5)}`,
      revenue 
    })
  } else {
    console.log(`[Simulator] 🥱 IGNORED. ${recipient.name} clicked but did not convert.`)
  }
}
