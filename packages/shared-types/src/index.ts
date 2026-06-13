// ─── Enums ────────────────────────────────────────────────────────────────────

export type Channel = 'whatsapp' | 'sms' | 'email' | 'rcs'

export type CommStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'read'
  | 'clicked'
  | 'converted'
  | 'failed'

export type CampaignStatus = 'draft' | 'sending' | 'sent' | 'completed'

export type SegmentCreatedBy = 'user' | 'ai'

// ─── Core Models ──────────────────────────────────────────────────────────────

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  city: string
  gender: 'male' | 'female' | 'other'
  birthday?: string | null
  createdAt: string
  totalSpend: number
  orderCount: number
  lastOrderDate?: string | null
}

export interface OrderItem {
  name: string
  category: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  customerId: string
  amount: number
  items: OrderItem[]
  createdAt: string
  communicationId?: string | null
}

export interface FilterRule {
  field: 'totalSpend' | 'orderCount' | 'daysSinceLastOrder' | 'city' | 'gender'
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'in'
  value: string | number | string[]
}

export interface Segment {
  id: string
  name: string
  description?: string | null
  filterConfig: FilterRule[]
  customerCount: number
  createdBy: SegmentCreatedBy
  createdAt: string
  updatedAt: string
}

export interface Campaign {
  id: string
  name: string
  segmentId: string
  channel: Channel
  messageTemplate: string
  status: CampaignStatus
  scheduledAt?: string | null
  createdAt: string
  createdBy?: string | null
  // relations (optional, populated on detail views)
  segment?: Pick<Segment, 'id' | 'name' | 'customerCount'>
  stats?: CampaignStats
}

export interface Communication {
  id: string
  campaignId: string
  customerId: string
  channel: Channel
  message: string
  status: CommStatus
  queuedAt: string
  sentAt?: string | null
  deliveredAt?: string | null
  openedAt?: string | null
  readAt?: string | null
  clickedAt?: string | null
  failedAt?: string | null
  convertedAt?: string | null
  metadata?: CommMetadata | null
  // optional relations
  customer?: Pick<Customer, 'id' | 'name' | 'email' | 'phone'>
}

export interface CommMetadata {
  failureReason?: string
  failureMessage?: string
  clickUrl?: string
  orderId?: string
  revenue?: number
}

export interface CampaignStats {
  id: string
  campaignId: string
  total: number
  sent: number
  delivered: number
  failed: number
  opened: number
  read: number
  clicked: number
  converted: number
  revenue: number
}

export interface SegmentStats {
  id: string
  segmentId: string
  campaignCount: number
  totalReach: number
  avgOpenRate: number
  avgClickRate: number
  totalConversions: number
  totalRevenue: number
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface SendPayload {
  commId: string
  campaignId: string
  recipient: {
    id: string
    phone: string
    email: string
    name: string
  }
  message: string
  channel: Channel
}

export interface ReceiptPayload {
  commId: string
  status: CommStatus
  channel: Channel
  timestamp: string
  metadata?: CommMetadata
}

// ─── Agent Types ──────────────────────────────────────────────────────────────

export type AgentStepType =
  | 'THINKING'
  | 'TOOL_START'
  | 'TOOL_RESULT'
  | 'PENDING_APPROVAL'
  | 'FINAL'
  | 'ERROR'

export interface AgentStep {
  type: AgentStepType
  content?: string
  tool?: string
  args?: Record<string, unknown>
  output?: unknown
  threadId?: string
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  error: string
  code?: string
  details?: unknown
}
