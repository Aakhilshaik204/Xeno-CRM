import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'
import {
  ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Clock,
  Mail, MessageSquare, Smartphone, Radio, Users, Send,
  TrendingUp, MousePointerClick, IndianRupee, Eye,
  ShoppingBag, PackageCheck, XCircle, ChevronDown,
  CalendarClock, BarChart3, Zap, Target
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell,
  PieChart, Pie
} from 'recharts'

// ── Channel icon ────────────────────────────────────────────
function ChannelIcon({ ch }: { ch: string }) {
  const map: any = {
    email: { Icon: Mail, label: 'Email', color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
    sms: { Icon: Smartphone, label: 'SMS', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
    whatsapp: { Icon: MessageSquare, label: 'WhatsApp', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    rcs: { Icon: Radio, label: 'RCS', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  }
  const { Icon, label, color, bg } = map[ch] || map.sms
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${bg} ${color}`}>
      <Icon className="w-3 h-3" />{label}
    </span>
  )
}

// ── Status badge ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: any = {
    draft:     { cls: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Draft' },
    scheduled: { cls: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Scheduled' },
    sending:   { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Sending' },
    sent:      { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Sent' },
    completed: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Completed' },
  }
  const { cls, label } = map[status] || { cls: 'bg-slate-100 text-slate-600 border-slate-200', label: status }
  return <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>{label}</span>
}

// ── Comm status badge ────────────────────────────────────────
function CommBadge({ status, metadata }: { status: string; metadata?: any }) {
  const map: any = {
    queued:    { cls: 'text-slate-500',   icon: <Clock className="w-3 h-3" />,            label: 'Queued' },
    sent:      { cls: 'text-sky-500',     icon: <Send className="w-3 h-3" />,             label: 'Sent' },
    delivered: { cls: 'text-blue-500',    icon: <PackageCheck className="w-3 h-3" />,     label: 'Delivered' },
    opened:    { cls: 'text-violet-500',  icon: <Eye className="w-3 h-3" />,              label: 'Opened' },
    read:      { cls: 'text-indigo-500',  icon: <Eye className="w-3 h-3" />,              label: 'Read' },
    clicked:   { cls: 'text-amber-500',   icon: <MousePointerClick className="w-3 h-3" />, label: 'Clicked' },
    converted: { cls: 'text-emerald-600', icon: <ShoppingBag className="w-3 h-3" />,      label: `Converted${metadata?.revenue ? ` (₹${Number(metadata.revenue).toLocaleString()})` : ''}` },
    failed:    { cls: 'text-rose-500',    icon: <XCircle className="w-3 h-3" />,          label: metadata?.failureMessage || 'Failed' },
  }
  const { cls, icon, label } = map[status] || { cls: 'text-slate-400', icon: null, label: status }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cls}`}>
      {icon}{label}
    </span>
  )
}

// ── KPI card ─────────────────────────────────────────────────
function KPICard({ label, value, sub, color, icon: Icon, pct }: any) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color.bg}`}>
          <Icon className={`w-4 h-4 ${color.icon}`} />
        </div>
      </div>
      <div className={`text-2xl font-extrabold tracking-tight ${color.val}`}>{value}</div>
      {sub && <div className="text-xs text-text-muted">{sub}</div>}
      {pct !== undefined && (
        <div className="mt-2 h-1.5 bg-surfaceHighlight rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      )}
    </div>
  )
}

const FUNNEL_COLORS = ['#6366f1', '#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981']

export default function CampaignDetail() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const intervalRef = useRef<any>(null)
  const statusRef = useRef<string>('')  // track status without re-creating interval

  const fetchData = async (isRefresh = false) => {
    if (isRefresh && refreshing) return
    if (isRefresh) setRefreshing(true)
    try {
      const res = await axios.get(`/api/campaigns/${id}`)
      setData(res.data)
      statusRef.current = res.data?.campaign?.status ?? ''
      // Stop polling once no longer sending
      if (!['sending', 'scheduled'].includes(statusRef.current)) {
        clearInterval(intervalRef.current)
      }
    } catch (e) {
      console.error('Failed to load campaign', e)
    } finally {
      setLoading(false)
      if (isRefresh) setRefreshing(false)
    }
  }

  // Single stable effect — interval created once per campaign ID
  useEffect(() => {
    fetchData()
    intervalRef.current = setInterval(() => {
      if (['sending'].includes(statusRef.current)) {
        fetchData(true)
      }
    }, 5000)
    return () => clearInterval(intervalRef.current)
  }, [id])

  if (loading && !data) return (
    <div className="h-64 flex items-center justify-center text-text-muted animate-pulse">Loading campaign...</div>
  )
  if (!data) return (
    <div className="h-64 flex items-center justify-center text-danger">Failed to load campaign</div>
  )

  const { campaign, recentCommunications } = data
  const s = campaign.stats || {}

  // ── Derived rates ──────────────────────────────────────────
  const safeRate = (num: number, den: number) => den > 0 ? +((num / den) * 100).toFixed(1) : 0
  const deliveryRate  = safeRate(s.delivered, s.total)
  const openRate      = safeRate(s.opened, s.delivered)
  const clickRate     = safeRate(s.clicked, s.opened)
  const convRate      = safeRate(s.converted, s.total)
  const failRate      = safeRate(s.failed, s.total)

  // ── Funnel data ────────────────────────────────────────────
  const funnelData = [
    { name: 'Total Sent',  value: s.total     || 0 },
    { name: 'Delivered',   value: s.delivered || 0 },
    { name: 'Opened',      value: s.opened    || 0 },
    { name: 'Clicked',     value: s.clicked   || 0 },
    { name: 'Converted',   value: s.converted || 0 },
  ].filter(f => f.value > 0)

  // ── Status breakdown for mini pie ─────────────────────────
  const statusBreakdown = [
    { name: 'Delivered', value: s.delivered || 0, fill: '#0ea5e9' },
    { name: 'Opened',    value: s.opened    || 0, fill: '#8b5cf6' },
    { name: 'Converted', value: s.converted || 0, fill: '#10b981' },
    { name: 'Failed',    value: s.failed    || 0, fill: '#f43f5e' },
  ].filter(d => d.value > 0)

  // ── Filtered feed ──────────────────────────────────────────
  const filteredComms = recentCommunications
    .filter((c: any) => statusFilter === 'all' || c.status === statusFilter)
    .filter((c: any) => !searchQuery || c.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.customer.email?.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <Link to="/campaigns" className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center hover:bg-surfaceHighlight transition-colors shrink-0 mt-0.5">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-extrabold tracking-tight truncate">{campaign.name}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <ChannelIcon ch={campaign.channel} />
            <StatusBadge status={campaign.status} />
            <span className="text-xs text-text-muted flex items-center gap-1"><CalendarClock className="w-3 h-3" /> Created {format(new Date(campaign.createdAt), 'MMM d, yyyy · h:mm a')}</span>
            {campaign.scheduledAt && (
              <span className="text-xs text-blue-600 font-medium">Scheduled for {format(new Date(campaign.scheduledAt), 'MMM d · h:mm a')}</span>
            )}
          </div>
        </div>
        <button onClick={() => fetchData(true)} title="Refresh"
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-surfaceHighlight transition-colors shrink-0">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-primary' : 'text-text-muted'}`} />
        </button>
      </div>

      {/* ── KPI Cards row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Total Sent"  value={(s.total || 0).toLocaleString()}     icon={Target}           color={{ bg: 'bg-slate-100',   icon: 'text-slate-600',   val: 'text-text',         bar: 'bg-slate-400' }} />
        <KPICard label="Delivered"   value={(s.delivered || 0).toLocaleString()} icon={PackageCheck}     color={{ bg: 'bg-sky-50',      icon: 'text-sky-600',     val: 'text-sky-700',      bar: 'bg-sky-400' }}   pct={deliveryRate} sub={`${deliveryRate}% rate`} />
        <KPICard label="Opened"      value={(s.opened || 0).toLocaleString()}    icon={Eye}              color={{ bg: 'bg-violet-50',   icon: 'text-violet-600',  val: 'text-violet-700',   bar: 'bg-violet-400' }} pct={openRate}     sub={`${openRate}% of delivered`} />
        <KPICard label="Clicked"     value={(s.clicked || 0).toLocaleString()}   icon={MousePointerClick} color={{ bg: 'bg-amber-50',   icon: 'text-amber-600',   val: 'text-amber-700',    bar: 'bg-amber-400' }} pct={clickRate}    sub={`${clickRate}% of opened`} />
        <KPICard label="Converted"   value={(s.converted || 0).toLocaleString()} icon={ShoppingBag}     color={{ bg: 'bg-emerald-50',  icon: 'text-emerald-600', val: 'text-emerald-700',  bar: 'bg-emerald-400' }} pct={convRate}   sub={`${convRate}% rate`} />
        <KPICard label="Revenue"     value={`₹${(s.revenue || 0).toLocaleString()}`} icon={IndianRupee} color={{ bg: 'bg-rose-50',     icon: 'text-rose-500',    val: 'text-rose-600',     bar: 'bg-rose-400' }} sub={s.converted ? `₹${Math.round((s.revenue||0)/(s.converted||1)).toLocaleString()}/conv` : undefined} />
      </div>

      {/* ── Middle row: Funnel + Details ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-5">
          {/* Funnel */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-sm">Message Funnel</h3>
              <span className="text-xs text-text-muted ml-1">Drop-off at each stage</span>
            </div>
            {funnelData.length > 0 ? (
              <div className="space-y-2">
                {funnelData.map((f, i) => {
                  const prev = funnelData[0].value
                  const pct = prev > 0 ? ((f.value / prev) * 100).toFixed(0) : 0
                  const dropoff = i > 0 ? funnelData[i-1].value - f.value : 0
                  return (
                    <div key={f.name}>
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: FUNNEL_COLORS[i] }} />
                          <span className="text-xs font-semibold">{f.name}</span>
                          {dropoff > 0 && <span className="text-[10px] text-rose-500 font-medium">-{dropoff.toLocaleString()}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-text-muted">{pct}%</span>
                          <span className="text-xs font-bold" style={{ color: FUNNEL_COLORS[i] }}>{f.value.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-surfaceHighlight rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: FUNNEL_COLORS[i] }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-text-muted text-sm">No dispatch data yet</div>
            )}

            {/* Rate chips */}
            {s.total > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border">
                {[
                  { label: 'Delivery', val: deliveryRate + '%', color: 'bg-sky-50 text-sky-700 border-sky-200' },
                  { label: 'Open',     val: openRate + '%',     color: 'bg-violet-50 text-violet-700 border-violet-200' },
                  { label: 'Click',    val: clickRate + '%',    color: 'bg-amber-50 text-amber-700 border-amber-200' },
                  { label: 'Conv.',    val: convRate + '%',     color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { label: 'Fail',     val: failRate + '%',     color: 'bg-rose-50 text-rose-700 border-rose-200' },
                ].map(r => (
                  <div key={r.label} className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${r.color}`}>
                    {r.label}: <strong>{r.val}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Simulation Feed (Small Box) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
            <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${campaign.status === 'sending' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                <h3 className="font-mono text-[11px] font-bold text-slate-200 tracking-wider">SIMULATION_FEED</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {recentCommunications.length.toLocaleString()} events
              </span>
            </div>

            <div className="h-48 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1">
              {recentCommunications.slice(0, 100).map((comm: any) => {
                let statusColor = 'text-slate-400'
                if (comm.status === 'sent') statusColor = 'text-sky-400'
                if (comm.status === 'delivered') statusColor = 'text-blue-400'
                if (comm.status === 'opened' || comm.status === 'read') statusColor = 'text-violet-400'
                if (comm.status === 'clicked') statusColor = 'text-amber-400'
                if (comm.status === 'converted') statusColor = 'text-emerald-400'
                if (comm.status === 'failed') statusColor = 'text-rose-400'

                const contact = campaign.channel === 'email' ? comm.customer?.email : comm.customer?.phone

                return (
                  <div key={`sim-${comm.id}`} className="hover:bg-slate-900/50 px-2 py-1 rounded transition-colors break-all">
                    <span className="text-slate-400">[{comm.queuedAt ? format(new Date(comm.queuedAt), 'HH:mm:ss') : '??:??:??'}]</span>
                    {' '}
                    <span className={`${statusColor} font-bold`}>[{comm.status?.toUpperCase() || 'UNKNOWN'}]</span>
                    {' '}
                    <span className="text-slate-200">{contact || 'Unknown Contact'}</span>
                    {' '}
                    <span className="text-slate-400">({comm.customer?.name || 'Unknown'})</span>
                    {comm.metadata?.revenue ? (
                      <span className="text-emerald-400 ml-1 font-bold">+₹{comm.metadata.revenue}</span>
                    ) : null}
                  </div>
                )
              })}
              {recentCommunications.length === 0 && (
                <div className="text-slate-500 italic">No events yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Campaign Info panel ── */}
        <div className="space-y-5">
          {/* Message Template */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Message Template</h4>
            <div className="bg-surfaceHighlight border border-border rounded-xl px-4 py-3 text-sm font-mono whitespace-pre-wrap leading-relaxed">
              {campaign.messageTemplate}
            </div>
          </div>

          {/* Targeting */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Targeting</h4>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/5 border border-border flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-text-muted" />
              </div>
              <div>
                <div className="font-semibold text-sm">{campaign.segment?.name || 'Unknown Segment'}</div>
                {campaign.segment?.description && (
                  <div className="text-xs text-text-muted mt-0.5 leading-relaxed">{campaign.segment.description}</div>
                )}
                <div className="text-xs text-text-muted mt-1">
                  {(campaign.segment?.customerCount || s.total || 0).toLocaleString()} customers
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── Targeted Customers ── */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm">Targeted Customers</h3>
            <span className="text-xs text-text-muted bg-surfaceHighlight px-2 py-0.5 rounded-full border border-border">
              {filteredComms.length.toLocaleString()} records
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search recipient..."
              className="px-3 py-1.5 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-44"
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {['all','queued','sent','delivered','opened','read','clicked','converted','failed'].map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surfaceHighlight/50 border-b border-border">
              <tr className="text-[10px] uppercase tracking-wider text-text-muted">
                <th className="px-5 py-3 text-left font-semibold">Recipient</th>
                <th className="px-5 py-3 text-left font-semibold">Contact</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
                <th className="px-5 py-3 text-left font-semibold">Order</th>
                <th className="px-5 py-3 text-right font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredComms.slice(0, 500).map((comm: any) => (
                <tr key={comm.id} className="hover:bg-surfaceHighlight/30 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/customers/${comm.customerId}`} className="font-semibold hover:text-primary transition-colors">
                      {comm.customer.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-xs text-text-muted">
                    {campaign.channel === 'email' ? comm.customer.email : comm.customer.phone}
                  </td>
                  <td className="px-5 py-3">
                    <CommBadge status={comm.status} metadata={comm.metadata} />
                  </td>
                  <td className="px-5 py-3 text-xs text-text-muted">
                    {comm.metadata?.orderId ? (
                      <span className="font-mono text-emerald-600">{comm.metadata.orderId.slice(0, 18)}…</span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-text-muted whitespace-nowrap">
                    {format(new Date(comm.queuedAt), 'MMM d, HH:mm:ss')}
                  </td>
                </tr>
              ))}
              {filteredComms.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-text-muted text-sm">
                    No communications match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredComms.length > 500 && (
          <div className="px-5 py-3 border-t border-border text-xs text-text-muted text-center">
            Showing first 500 of {filteredComms.length.toLocaleString()} records
          </div>
        )}
      </div>
    </div>
  )
}
