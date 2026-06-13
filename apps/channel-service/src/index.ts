import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { SendPayload } from '@xenocrm/shared-types'
import { jobQueue, callbackQueue, stats, deadLetters, enqueueJob } from './queue'

// Load environment variables (mostly for testing standalone)
import * as dotenv from 'dotenv'
dotenv.config()

const app = express()
app.use(helmet())
app.use(express.json())
app.use(morgan('dev'))

// ─── API Routes ──────────────────────────────────────────────────────────────

// The main entry point for the CRM to dispatch communications
app.post('/send', (req, res) => {
  const payload = req.body as SendPayload
  
  if (!payload.commId || !payload.campaignId || !payload.recipient || !payload.message || !payload.channel) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Log incoming payload details
  console.log(`\n[API] 📥 Received job to send ${payload.channel} to ${payload.recipient.name} (${payload.recipient.email || payload.recipient.phone})`)

  // Fire-and-forget: we accept the job and process it asynchronously
  enqueueJob(payload)
  
  res.status(202).json({ jobId: payload.commId, status: 'queued' })
})

// ─── Observability Routes ────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'xenocrm-channel-service',
    queueSize: jobQueue.size,
    callbackQueueSize: callbackQueue.size,
    processed: stats.processedJobs
  })
})

app.get('/stats', (_req, res) => {
  res.json(stats)
})

app.get('/dead-letters', (_req, res) => {
  res.json(deadLetters)
})

// ─── Start Server ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`📡 Channel Service running on http://localhost:${PORT}`)
  console.log(`Webhook configured to: ${process.env.CRM_RECEIPT_URL || 'http://localhost:3001/api/receipts'}`)
})
