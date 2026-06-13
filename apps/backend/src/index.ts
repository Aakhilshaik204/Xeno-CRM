import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

const app = express()
const PORT = process.env.PORT || 3001

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:5173'], credentials: true }))
app.use(express.json())
app.use(morgan('dev'))

// Intercept res.json to automatically append 'Z' to timezone-less timestamps
// returned by Supabase, so the frontend correctly parses them as UTC.
const originalJson = express.response.json
express.response.json = function (body) {
  const appendZToDates = (obj: any) => {
    if (!obj || typeof obj !== 'object') return
    for (const key in obj) {
      if (typeof obj[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(obj[key])) {
        obj[key] += 'Z'
      } else if (typeof obj[key] === 'object') {
        appendZToDates(obj[key])
      }
    }
  }
  appendZToDates(body)
  return originalJson.call(this, body)
}

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'xenocrm-backend', timestamp: new Date().toISOString() })
})

import audiencesRouter from './routes/audiences'
import campaignsRouter from './routes/campaigns'
import receiptsRouter from './routes/receipts'
import agentRouter from './routes/agent'
import analyticsRouter from './routes/analytics'
import communicationsRouter from './routes/communications'
import dashboardRouter from './routes/dashboard'
import ordersRouter from './routes/orders'
import customersRouter from './routes/customers'
import healthRouter from './routes/health'
import { startScheduler } from './services/scheduler'

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/audiences', audiencesRouter)
app.use('/api/campaigns', campaignsRouter)
app.use('/api/receipts', receiptsRouter)
app.use('/api/agent', agentRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/communications', communicationsRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/customers', customersRouter)
app.use('/api/customer-health', healthRouter)

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 XenoCRM Backend running on http://localhost:${PORT}`)
  startScheduler()
})

export default app
