import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowLeft, Users, Mail, MapPin, IndianRupee, ShoppingBag,
  Filter, Send, Brain, ChevronRight, ChevronDown, Sparkles,
  Calendar, Star, Phone, User, Package, MessageSquare, X
} from 'lucide-react'
import Skeleton from '../components/Skeleton'
import { format } from 'date-fns'

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Platinum: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
  Gold:     { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500'  },
  Silver:   { bg: 'bg-slate-100', text: 'text-slate-700',  border: 'border-slate-200',  dot: 'bg-slate-400'  },
  Bronze:   { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
}

const COMM_STATUS: Record<string, { color: string; bg: string }> = {
  converted: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  clicked:   { color: 'text-sky-700',     bg: 'bg-sky-50 border-sky-200'         },
  opened:    { color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200'        },
  delivered: { color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200'   },
  sent:      { color: 'text-slate-600',   bg: 'bg-slate-100 border-slate-200'    },
  failed:    { color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200'       },
  queued:    { color: 'text-slate-500',   bg: 'bg-slate-100 border-slate-200'    },
}

function getAvatar(name: string, index: number) {
  const colors = ['bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500']
  return {
    color: colors[index % colors.length],
    initials: name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  }
}

function TierBadge({ tier }: { tier: string }) {
  const t = TIER_COLORS[tier] || { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${t.bg} ${t.text} border ${t.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
      {tier}
    </span>
  )
}

// ── Inline customer detail panel ─────────────────────────────
function CustomerDetailPanel({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'orders' | 'comms'>('orders')

  useEffect(() => {
    setLoading(true)
    axios.get(`/api/customers/${customerId}`)
      .then(res => setDetail(res.data.customer))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [customerId])

  return (
    <tr>
      <td colSpan={5} className="p-0">
        <div className="bg-surfaceHighlight/60 border-t border-b border-border px-6 py-5 animate-fade-in">
          {loading ? (
            <div className="flex gap-4">
              <div className="w-48 h-20 bg-border rounded-xl animate-pulse" />
              <div className="flex-1 h-20 bg-border rounded-xl animate-pulse" />
            </div>
          ) : !detail ? (
            <p className="text-sm text-text-muted">Could not load details.</p>
          ) : (
            <div className="flex flex-col gap-4">

              {/* Top row: info + close */}
              <div className="flex items-start gap-4">
                {/* Contact info */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-surface rounded-xl border border-border px-4 py-3">
                    <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">Phone</div>
                    <div className="text-sm font-semibold flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-text-muted" /> {detail.phone}
                    </div>
                  </div>
                  <div className="bg-surface rounded-xl border border-border px-4 py-3">
                    <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">Gender</div>
                    <div className="text-sm font-semibold flex items-center gap-1.5">
                      <User className="w-3 h-3 text-text-muted" /> {detail.gender}
                    </div>
                  </div>
                  <div className="bg-surface rounded-xl border border-border px-4 py-3">
                    <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">Birthday</div>
                    <div className="text-sm font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-text-muted" />
                      {detail.birthday ? format(new Date(detail.birthday), 'MMM d, yyyy') : '—'}
                    </div>
                  </div>
                  <div className="bg-surface rounded-xl border border-border px-4 py-3">
                    <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">Member Since</div>
                    <div className="text-sm font-semibold flex items-center gap-1.5">
                      <Star className="w-3 h-3 text-text-muted" />
                      {format(new Date(detail.createdAt), 'MMM yyyy')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center hover:bg-surfaceHighlight transition-colors shrink-0 mt-0.5"
                >
                  <X className="w-3.5 h-3.5 text-text-muted" />
                </button>
              </div>

              {/* Tabs */}
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="flex border-b border-border">
                  {([
                    { key: 'orders', label: 'Orders', count: detail.orders?.length ?? 0, icon: Package },
                    { key: 'comms',  label: 'Campaigns',  count: detail.communications?.length ?? 0, icon: MessageSquare },
                  ] as const).map(t => {
                    const Icon = t.icon
                    return (
                      <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition-colors border-b-2 ${
                          tab === t.key
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-text-muted hover:text-text'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {t.label}
                        <span className="px-1.5 py-0.5 rounded-full bg-surfaceHighlight border border-border text-[10px] font-normal">
                          {t.count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Orders tab */}
                {tab === 'orders' && (
                  <div className="max-h-52 overflow-y-auto">
                    {!detail.orders?.length ? (
                      <p className="px-5 py-6 text-xs text-text-muted text-center">No orders found.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="bg-surfaceHighlight/50 border-b border-border sticky top-0">
                          <tr className="text-[10px] uppercase tracking-wider text-text-muted">
                            <th className="px-5 py-2.5 text-left font-semibold">Date</th>
                            <th className="px-5 py-2.5 text-left font-semibold">Items</th>
                            <th className="px-5 py-2.5 text-right font-semibold">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {detail.orders.map((o: any) => {
                            const items: any[] = Array.isArray(o.items) ? o.items : []
                            return (
                              <tr key={o.id} className="hover:bg-surfaceHighlight/30">
                                <td className="px-5 py-2.5 text-text-muted whitespace-nowrap">
                                  {format(new Date(o.createdAt), 'MMM d, yyyy')}
                                </td>
                                <td className="px-5 py-2.5">
                                  <div className="flex flex-wrap gap-1">
                                    {items.slice(0, 2).map((item: any, idx: number) => (
                                      <span key={idx} className="px-2 py-0.5 rounded-md bg-surfaceHighlight border border-border text-text-muted">
                                        {item.name || item.productName || `Item ${idx + 1}`}
                                        {item.quantity > 1 ? ` x${item.quantity}` : ''}
                                      </span>
                                    ))}
                                    {items.length > 2 && (
                                      <span className="px-2 py-0.5 rounded-md bg-surfaceHighlight border border-border text-text-muted">
                                        +{items.length - 2} more
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-2.5 text-right font-bold text-emerald-600">
                                  ₹{o.amount.toLocaleString()}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Comms tab */}
                {tab === 'comms' && (
                  <div className="max-h-52 overflow-y-auto divide-y divide-border">
                    {!detail.communications?.length ? (
                      <p className="px-5 py-6 text-xs text-text-muted text-center">No campaign messages yet.</p>
                    ) : (
                      detail.communications.map((comm: any) => {
                        const s = COMM_STATUS[comm.status] || COMM_STATUS.queued
                        return (
                          <div key={comm.id} className="px-5 py-3 flex items-start gap-3 hover:bg-surfaceHighlight/30">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="font-semibold text-xs">{comm.campaign?.name || 'Campaign'}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surfaceHighlight border border-border text-text-muted uppercase">{comm.channel}</span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}>
                                  {comm.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-text-muted line-clamp-1">{comm.message}</p>
                            </div>
                            <span className="text-[10px] text-text-muted shrink-0 whitespace-nowrap">
                              {format(new Date(comm.queuedAt), 'MMM d')}
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function SegmentDetail() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<{ segment: any; customers: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchCustomer, setSearchCustomer] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    axios.get(`/api/audiences/${id}`)
      .then(res => setData(res.data))
      .catch(e => console.error('Failed to load segment', e))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="w-48 h-8 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="w-full h-96 rounded-2xl" />
      </div>
    )
  }

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Users className="w-12 h-12 text-text-muted opacity-30" />
      <p className="text-text-muted font-medium">Segment not found</p>
      <Link to="/audiences" className="btn-primary text-sm">Back to Audiences</Link>
    </div>
  )

  const { segment, customers } = data
  const rules: any[] = segment.filterConfig || []

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    c.email.toLowerCase().includes(searchCustomer.toLowerCase())
  )

  const avgSpend = customers.length ? Math.round(customers.reduce((a, c) => a + c.totalSpend, 0) / customers.length) : 0
  const topTier = customers.length ? customers.reduce((a, c) => a.totalSpend > c.totalSpend ? a : c, customers[0]) : null

  const toggleCustomer = (cId: string) => setExpandedId(prev => prev === cId ? null : cId)

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/audiences"
          className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center hover:bg-surfaceHighlight transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-extrabold tracking-tight truncate">{segment.name}</h2>
            {segment.createdBy === 'ai' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full shrink-0">
                <Sparkles className="w-3 h-3" /> AI Generated
              </span>
            )}
          </div>
          <p className="text-text-muted text-sm mt-0.5 truncate">{segment.description || 'No description provided'}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Audience Size', value: segment.customerCount.toLocaleString(), icon: Users, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Filter Rules', value: rules.length, icon: Filter, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Avg. Spend', value: `₹${avgSpend.toLocaleString()}`, icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Created', value: format(new Date(segment.createdAt), 'MMM d, yyyy'), icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-surface rounded-2xl border border-border p-5 flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-xl font-extrabold">{stat.value}</div>
                <div className="text-xs text-text-muted font-medium mt-0.5">{stat.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter Rules + Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-surface rounded-2xl border border-border p-6 flex flex-col gap-4">
          <h3 className="font-bold flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-violet-500" /> Segment Filter Rules
          </h3>
          <div className="flex flex-col gap-2">
            {rules.length === 0 && (
              <p className="text-sm text-text-muted italic">No filter rules — this segment matches all customers.</p>
            )}
            {rules.map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-surfaceHighlight rounded-xl px-4 py-3 border border-border">
                <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  {r.field === 'id' ? (
                    <span className="font-bold text-primary">
                      {r.operator === 'notIn' ? 'Excluded specific customers' : 'Specific customers selected'}
                    </span>
                  ) : (
                    <>
                      <span className="font-semibold text-text">{r.field}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 text-xs font-mono">{r.operator}</span>
                      <span className="font-bold text-primary">{String(r.value)}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 flex flex-col gap-3">
          <h3 className="font-bold text-sm mb-1">Quick Actions</h3>
          <Link to="/campaigns" className="w-full flex items-center gap-3 bg-primary text-white font-semibold px-4 py-3 rounded-xl hover:bg-primary-hover transition-colors text-sm">
            <Send className="w-4 h-4" />
            <span className="flex-1">Create Campaign</span>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </Link>
          <Link to="/agent" className="w-full flex items-center gap-3 bg-violet-50 text-violet-700 border border-violet-200 font-semibold px-4 py-3 rounded-xl hover:bg-violet-100 transition-colors text-sm">
            <Brain className="w-4 h-4" />
            <span className="flex-1">Draft with AI</span>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </Link>
          {topTier && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-2">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Top Spender
              </div>
              <div className="font-bold text-sm">{topTier.name}</div>
              <div className="text-xs text-amber-600 font-semibold mt-0.5">₹{topTier.totalSpend.toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surfaceHighlight/50">
          <h3 className="font-bold flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-sky-500" />
            Customer Profiles
            <span className="text-xs font-normal text-text-muted">({customers.length} total)</span>
          </h3>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchCustomer}
            onChange={e => setSearchCustomer(e.target.value)}
            className="pl-3 pr-3 py-1.5 text-xs bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-44"
          />
        </div>

        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-text-muted border-b border-border bg-surfaceHighlight/30">
              <th className="px-6 py-3.5 font-semibold">Customer</th>
              <th className="px-6 py-3.5 font-semibold">Location</th>
              <th className="px-6 py-3.5 font-semibold text-center">Tier</th>
              <th className="px-6 py-3.5 font-semibold text-center">Orders</th>
              <th className="px-6 py-3.5 font-semibold text-right">Lifetime Spend</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c: any, i: number) => {
              const { color, initials } = getAvatar(c.name, i)
              const isExpanded = expandedId === c.id
              return (
                <>
                  <tr
                    key={c.id}
                    onClick={() => toggleCustomer(c.id)}
                    className={`cursor-pointer transition-colors border-t border-border group ${
                      isExpanded ? 'bg-surfaceHighlight/60' : 'hover:bg-surfaceHighlight/40'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                          {initials}
                        </div>
                        <div>
                          <div className={`font-semibold text-sm transition-colors ${isExpanded ? 'text-primary' : 'group-hover:text-primary'}`}>
                            {c.name}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
                            <Mail className="w-3 h-3" /> {c.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-text-muted">
                        <MapPin className="w-3.5 h-3.5" /> {c.city}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <TierBadge tier={c.membershipTier} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-surfaceHighlight border border-border">
                        <ShoppingBag className="w-3 h-3" /> {c.orderCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                          <IndianRupee className="w-3.5 h-3.5" /> {c.totalSpend.toLocaleString()}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <CustomerDetailPanel
                      key={`detail-${c.id}`}
                      customerId={c.id}
                      onClose={() => setExpandedId(null)}
                    />
                  )}
                </>
              )
            })}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                  No customers match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
