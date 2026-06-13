import PQueue from 'p-queue'
import axios from 'axios'
import { Channel, CommStatus, CommMetadata, ReceiptPayload, SendPayload } from '@xenocrm/shared-types'
import { processJob } from './simulator'

// Maximum 1000 concurrent jobs, max 1000 jobs per second (simulating provider rate limits)
export const jobQueue = new PQueue({ concurrency: 1000, intervalCap: 1000, interval: 1000 })

// Separate queue for callbacks to the CRM to prevent blocking the main simulator
export const callbackQueue = new PQueue({ concurrency: 10 })

export const stats = {
  processedJobs: 0,
  callbacksSent: 0,
  callbacksFailed: 0,
  retried: 0,
  sent: 0,
  delivered: 0,
  failed: 0,
}

export const deadLetters: any[] = []

// Target URL for the CRM receipt webhook
const CRM_RECEIPT_URL = process.env.CRM_RECEIPT_URL || 'http://localhost:3001/api/receipts'

export async function enqueueJob(job: SendPayload) {
  jobQueue.add(async () => {
    try {
      await processJob(job)
      stats.processedJobs++
    } catch (e) {
      console.error(`[Queue] Error processing job ${job.commId}`, e)
    }
  })
}

/**
 * Fires a callback to the CRM with exponential backoff on failure.
 * Retries up to 3 times: 2s -> 4s -> 8s
 */
export async function fireCallback(commId: string, status: CommStatus, channel: Channel, metadata?: CommMetadata, attempt = 1) {
  callbackQueue.add(async () => {
    const payload: ReceiptPayload = {
      commId,
      status,
      channel,
      timestamp: new Date().toISOString(),
      metadata
    }

    try {
      await axios.post(CRM_RECEIPT_URL, payload, { timeout: 30000 })
      stats.callbacksSent++
      
      // Update basic status counters for stats endpoint
      if (status === 'sent') stats.sent++
      if (status === 'delivered') stats.delivered++
      if (status === 'failed') stats.failed++

    } catch (error: any) {
      if (attempt < 3) {
        stats.retried++
        const delay = Math.pow(2, attempt) * 1000 // 2s, 4s
        console.warn(`[Queue] Callback failed for ${commId} (${status}), retrying in ${delay}ms... (Attempt ${attempt}/3)`)
        setTimeout(() => fireCallback(commId, status, channel, metadata, attempt + 1), delay)
      } else {
        console.error(`[Queue] Callback completely failed for ${commId} (${status}) after 3 attempts.`)
        stats.callbacksFailed++
        deadLetters.push({ payload, error: error.message, time: new Date().toISOString() })
      }
    }
  })
}
