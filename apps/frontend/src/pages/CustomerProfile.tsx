import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'
import {
  ArrowLeft, User, Mail, Phone, MapPin, IndianRupee,
  ShoppingBag, Calendar, Star, CreditCard, Package,
  MessageSquare, CheckCircle2, Clock, XCircle, ChevronRight,
  Activity, AlertTriangle, TrendingDown
} from 'lucide-react'

const TIER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Platinum: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  Gold:     { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
  Silver:   { bg: 'bg-slate-100', text: 'text-slate-600',  border: 'border-slate-300'  },
  Bronze:   { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  None:     { bg: 'bg-slate-100', text: 'text-slate-500',  border: 'border-slate-200'  },
}

const STATUS_STYLES: Record<string, { icon: any; color: string; bg: string }> = {
  converted: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  clicked:   { icon: CheckCircle2, color: 'text-sky-600',     bg: 'bg-sky-50'     },
  opened:    { icon: CheckCircle2, color: 'text-blue-600',    bg: 'bg-blue-50'    },
  delivered: { icon: CheckCircle2, color: 'text-indigo-500',  bg: 'bg-indigo-50'  },
  sent:      { icon: Clock,        color: 'text-slate-500',   bg: 'bg-slate-100'  },
  failed:    { icon: XCircle,      color: 'text-rose-600',    bg: 'bg-rose-50'    },
  queued:    { icon: Clock,        color: 'text-slate-400',   bg: 'bg-slate-100'  },
}

function getAvatarColor(name: string) {
  const colors = ['bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500']
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function StatCard({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <div className="text-xl font-extrabold">{value}</div>
        <div className="text-xs text-text-muted font-medium mt-0.5">{label}</div>
      </div>
    </div>
  )
}

export default function CustomerProfile() {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'orders' | 'comms'>('orders')
  const [health, setHealth] = useState<any>(null)

  useEffect(() => {
    axios.get(`/api/customers/${id}`)
      .then(res => setCustomer(res.data.customer))
      .catch(console.error)
      .finally(() => setLoading(false))
    axios.get(`/api/customer-health/customer/${id}`)
      .then(res => setHealth(res.data.health))
      .catch(() => {})
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-surfaceHighlight rounded-xl animate-pulse" />
        <div className="h-40 bg-surfaceHighlight rounded-2xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-surfaceHighlight rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <User className="w-12 h-12 text-text-muted opacity-30" />
        <p className="text-text-muted font-medium">Customer not found</p>
        <Link to="/audiences" className="text-sm text-primary font-semibold hover:underline">
          Back to Audiences
        </Link>
      </div>
    )
  }

  const tier = TIER_STYLES[customer.membershipTier] || TIER_STYLES.None
  const avatarColor = getAvatarColor(customer.name)
  const initials = getInitials(customer.name)
  const daysSince = customer.lastOrderDate
    ? Math.floor((Date.now() - new Date(customer.lastOrderDate).getTime()) / 86400000)
    : null

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Back */}
      <Link
        to={-1 as any}
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Profile hero */}
      <div className="bg-surface border border-border rounded-2xl p-6 flex items-center gap-6">
        <div className={`w-20 h-20 rounded-2xl ${avatarColor} flex items-center justify-center text-white text-2xl font-extrabold shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h2 className="text-2xl font-extrabold">{customer.name}</h2>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${tier.bg} ${tier.text} ${tier.border}`}>
              <Star className="w-3 h-3 fill-current" /> {customer.membershipTier}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-sm text-text-muted">
              <Mail className="w-3.5 h-3.5 shrink-0" /> {customer.email}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-text-muted">
              <Phone className="w-3.5 h-3.5 shrink-0" /> {customer.phone}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-text-muted">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> {customer.city}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-text-muted">
              <User className="w-3.5 h-3.5 shrink-0" /> {customer.gender}
            </span>
            {customer.birthday && (
              <span className="flex items-center gap-1.5 text-sm text-text-muted">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                {format(new Date(customer.birthday), 'MMM d, yyyy')}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-sm text-text-muted">
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              Customer since {format(new Date(customer.createdAt), 'MMM yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Lifetime Spend"
          value={`₹${customer.totalSpend.toLocaleString()}`}
          icon={IndianRupee}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <StatCard
          label="Total Orders"
          value={customer.orderCount}
          icon={ShoppingBag}
          color="text-sky-600"
          bg="bg-sky-50"
        />
        <StatCard
          label="Avg Order Value"
          value={customer.orderCount > 0 ? `₹${Math.round(customer.totalSpend / customer.orderCount).toLocaleString()}` : '—'}
          icon={CreditCard}
          color="text-violet-600"
          bg="bg-violet-50"
        />
        <StatCard
          label="Last Order"
          value={daysSince !== null ? `${daysSince}d ago` : 'Never'}
          icon={Calendar}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      {/* Health Score Widget */}
      {health && (() => {
        const zone = health.zone
        const color = zone === 'healthy' ? '#10b981' : zone === 'at_risk' ? '#f59e0b' : '#f43f5e'
        const zoneLabel = zone === 'healthy' ? 'Healthy' : zone === 'at_risk' ? 'At Risk' : 'Churning'
        const ZoneIcon = zone === 'healthy' ? CheckCircle2 : zone === 'at_risk' ? AlertTriangle : TrendingDown
        const zoneBg = zone === 'healthy' ? 'bg-emerald-50 border-emerald-200' : zone === 'at_risk' ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'
        const scoreZoneColor = zone === 'healthy' ? 'text-emerald-600' : zone === 'at_risk' ? 'text-amber-600' : 'text-rose-600'
        const radius = 44
        const circumference = 2 * Math.PI * radius
        const strokeDash = (health.score / 100) * circumference
        return (
          <div className={`bg-surface border rounded-2xl p-6 ${zoneBg}`}>
            <div className="flex items-center gap-6">
              {/* Circular gauge */}
              <div className="relative shrink-0" style={{ width: 104, height: 104 }}>
                <svg width={104} height={104} className="-rotate-90">
                  <circle cx={52} cy={52} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={8} />
                  <circle cx={52} cy={52} r={radius} fill="none" stroke={color} strokeWidth={8}
                    strokeDasharray={`${strokeDash} ${circumference}`}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold" style={{ color }}>{health.score}</span>
                  <span className="text-[9px] text-text-muted font-medium">/ 100</span>
                </div>
              </div>
              {/* Label + breakdown */}
              <div className="flex-1">
                <div className={`flex items-center gap-2 mb-3`}>
                  <ZoneIcon className={`w-4 h-4 ${scoreZoneColor}`} />
                  <span className={`font-bold ${scoreZoneColor}`}>{zoneLabel} Relationship</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {[
                    { label: 'Recency', score: health.breakdown.recency.score, max: 35, color: 'bg-sky-500' },
                    { label: 'Engagement', score: health.breakdown.engagement.score, max: 30, color: 'bg-violet-500' },
                    { label: 'Spend Trend', score: health.breakdown.spendTrajectory.score, max: 20, color: 'bg-emerald-500' },
                    { label: 'Frequency', score: health.breakdown.frequency.score, max: 15, color: 'bg-amber-500' },
                  ].map(b => (
                    <div key={b.label}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-text-muted">{b.label}</span>
                        <span className="font-bold">{b.score}/{b.max}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/60">
                        <div className={`h-1.5 rounded-full ${b.color}`} style={{ width: `${(b.score / b.max) * 100}%`, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Tabs */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="flex border-b border-border">
          {([
            { key: 'orders', label: 'Order History', count: customer.orders.length, icon: Package },
            { key: 'comms',  label: 'Campaign Messages', count: customer.communications.length, icon: MessageSquare },
          ] as const).map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-text-muted hover:text-text'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-surfaceHighlight border border-border">
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Order History */}
        {activeTab === 'orders' && (
          <div>
            {customer.orders.length === 0 ? (
              <div className="py-16 text-center text-text-muted text-sm">No orders yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-surfaceHighlight/50 border-b border-border">
                  <tr className="text-xs uppercase tracking-wider text-text-muted">
                    <th className="px-6 py-3.5 text-left font-semibold">Date</th>
                    <th className="px-6 py-3.5 text-left font-semibold">Items</th>
                    <th className="px-6 py-3.5 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customer.orders.map((order: any) => {
                    const items: any[] = Array.isArray(order.items) ? order.items : []
                    return (
                      <tr key={order.id} className="hover:bg-surfaceHighlight/40 transition-colors">
                        <td className="px-6 py-4 text-text-muted whitespace-nowrap">
                          {format(new Date(order.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {items.slice(0, 3).map((item: any, i: number) => (
                              <span key={i} className="text-xs px-2 py-1 rounded-lg bg-surfaceHighlight border border-border text-text-muted">
                                {item.name || item.productName || `Item ${i + 1}`}
                                {item.quantity > 1 && ` x${item.quantity}`}
                              </span>
                            ))}
                            {items.length > 3 && (
                              <span className="text-xs px-2 py-1 rounded-lg bg-surfaceHighlight border border-border text-text-muted">
                                +{items.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                          ₹{order.amount.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Campaign Communications */}
        {activeTab === 'comms' && (
          <div>
            {customer.communications.length === 0 ? (
              <div className="py-16 text-center text-text-muted text-sm">No campaign messages sent yet</div>
            ) : (
              <div className="divide-y divide-border">
                {customer.communications.map((comm: any) => {
                  const s = STATUS_STYLES[comm.status] || STATUS_STYLES.queued
                  const StatusIcon = s.icon
                  return (
                    <div key={comm.id} className="px-6 py-4 flex items-start gap-4 hover:bg-surfaceHighlight/40 transition-colors">
                      <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <StatusIcon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm truncate">
                            {comm.campaign?.name || 'Campaign'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surfaceHighlight border border-border text-text-muted uppercase">
                            {comm.channel}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.color} border border-current/20`}>
                            {comm.status}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">{comm.message}</p>
                        <p className="text-[10px] text-text-muted mt-1.5">
                          {format(new Date(comm.queuedAt), 'MMM d, yyyy · h:mm a')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
