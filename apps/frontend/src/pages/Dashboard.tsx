import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Users, Send, IndianRupee, ShoppingBag, Activity,
  Star, TrendingUp, CheckCircle2, MousePointerClick,
  Mail, MessageSquare, Radio, ChevronRight, ArrowRight, Brain,
  AlertTriangle, TrendingDown, HeartPulse
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import Skeleton from '../components/Skeleton'
import { format } from 'date-fns'
import { useUser } from '@clerk/clerk-react'

const TIER_COLORS = ['#7c3aed', '#f59e0b', '#64748b', '#c2410c']
const CHANNEL_COLORS: Record<string, string> = {
  sms:      '#6366f1',
  email:    '#0ea5e9',
  whatsapp: '#10b981',
  rcs:      '#f59e0b',
}

function StatCard({ label, value, icon: Icon, color, bg, sub }: any) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-5 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {sub && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />{sub}
        </span>}
      </div>
      <div>
        <p className="text-xs font-medium text-text-muted mb-1">{label}</p>
        <h3 className="text-2xl font-extrabold tracking-tight">{value}</h3>
      </div>
    </div>
  )
}

function RateCard({ label, value, icon: Icon, color, bg, desc }: any) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-extrabold">{value}%</p>
        <p className="text-[10px] text-text-muted mt-0.5">{desc}</p>
      </div>
      {/* Mini progress bar */}
      <div className="w-16 h-1.5 rounded-full bg-surfaceHighlight overflow-hidden shrink-0">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(value, 100)}%`, background: color.replace('text-', '') }}
        />
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-bold mb-1.5 text-text">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
          <span className="text-text-muted">{p.name}:</span>
          <span className="font-semibold">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useUser()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [churnAlerts, setChurnAlerts] = useState<any[]>([])

  useEffect(() => {
    axios.get('/api/dashboard')
      .then(res => setData(res.data))
      .catch(e => console.error('Failed to load dashboard', e))
      .finally(() => setLoading(false))
    axios.get('/api/customer-health/alerts')
      .then(res => setChurnAlerts(res.data.alerts?.slice(0, 3) || []))
      .catch(() => {})
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-surface rounded-2xl border border-border p-5 space-y-4">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="w-1/2 h-3" />
              <Skeleton className="w-3/4 h-7" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!data || !data.metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <h3 className="text-xl font-bold">API Connection Failed</h3>
        <p className="text-text-muted max-w-md">
          The dashboard couldn't connect to the backend. Please ensure you have set the <code>VITE_API_URL</code> environment variable in Vercel to your Render backend URL, and then trigger a new deployment.
        </p>
      </div>
    )
  }
  const { metrics, channelsUsed, campaignReach, customerTiers, recentCampaigns } = data

  return (
    <div className="space-y-7 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-text-muted text-sm font-medium mb-1">{greeting}, {user?.firstName}</p>
          <h2 className="text-3xl font-extrabold tracking-tight">Dashboard</h2>
        </div>
        <Link
          to="/agent"
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-hover transition-colors shadow-sm text-sm"
        >
          <Brain className="w-4 h-4" /> AI Agent <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ── Top KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Customers"  value={metrics.totalCustomers.toLocaleString()} icon={Users}         color="text-sky-600"     bg="bg-sky-50"     sub="+12%" />
        <StatCard label="Total Orders"     value={metrics.totalOrders.toLocaleString()}    icon={ShoppingBag}    color="text-violet-600"  bg="bg-violet-50"  sub="+8%"  />
        <StatCard label="Campaigns Sent"   value={metrics.campaigns}                       icon={Send}           color="text-indigo-600"  bg="bg-indigo-50"  sub="+5%"  />
        <StatCard label="Attributed Revenue" value={`₹${metrics.revenue.toLocaleString()}`} icon={IndianRupee}  color="text-emerald-600" bg="bg-emerald-50" sub="+22%" />
      </div>

      {/* ── Rate Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RateCard
          label="Avg Delivery Rate"
          value={metrics.avgDeliveryRate}
          icon={CheckCircle2}
          color="text-sky-600"
          bg="bg-sky-50"
          desc="Messages delivered / sent"
        />
        <RateCard
          label="Avg Open Rate"
          value={metrics.avgOpenRate}
          icon={Activity}
          color="text-violet-600"
          bg="bg-violet-50"
          desc="Opened / delivered"
        />
        <RateCard
          label="Avg Click Rate"
          value={metrics.avgClickRate}
          icon={MousePointerClick}
          color="text-emerald-600"
          bg="bg-emerald-50"
          desc="Clicked / opened"
        />
      </div>

      {/* ── Campaign Reach Graph + Channels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Campaign Reach Bar Chart */}
        <div className="bg-surface rounded-2xl border border-border p-6 lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" /> Campaign Reach
              </h3>
              <p className="text-xs text-text-muted mt-0.5">Sent · Delivered · Converted per campaign</p>
            </div>
            <Link to="/campaigns" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              All campaigns <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {campaignReach.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-text-muted text-sm py-10">No campaign data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={campaignReach} barGap={3} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                <Bar dataKey="reach"     name="Sent"      fill="#6366f1" radius={[4,4,0,0]} maxBarSize={24} />
                <Bar dataKey="delivered" name="Delivered" fill="#0ea5e9" radius={[4,4,0,0]} maxBarSize={24} />
                <Bar dataKey="converted" name="Converted" fill="#10b981" radius={[4,4,0,0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Channels Used */}
        <div className="bg-surface rounded-2xl border border-border p-6 flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-500" /> Channels Used
            </h3>
            <p className="text-xs text-text-muted mt-0.5">Campaign distribution</p>
          </div>
          {channelsUsed.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-text-muted text-sm">No data</div>
          ) : (
            <>
              <div className="relative flex-1 min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelsUsed}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {channelsUsed.map((entry: any) => (
                        <Cell key={entry.name} fill={CHANNEL_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2">
                {channelsUsed.map((ch: any) => {
                  const Icon = ch.name === 'email' ? Mail : MessageSquare
                  return (
                    <div key={ch.name} className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHANNEL_COLORS[ch.name] || '#94a3b8' }} />
                      <Icon className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-xs font-medium uppercase text-text-muted flex-1">{ch.name}</span>
                      <span className="text-xs font-bold">{ch.count} campaigns</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Customer Tier Donut + Recent Campaigns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Customer Tiers */}
        <div className="bg-surface rounded-2xl border border-border p-6 flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> Customer Tiers
            </h3>
            <p className="text-xs text-text-muted mt-0.5">Membership distribution</p>
          </div>
          <div className="relative flex-1 min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={customerTiers}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {customerTiers.map((_: any, i: number) => (
                    <Cell key={i} fill={TIER_COLORS[i % TIER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-xl font-extrabold">{metrics.totalCustomers.toLocaleString()}</div>
                <div className="text-[10px] text-text-muted">Customers</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {customerTiers.map((t: any, i: number) => (
              <div key={t.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: TIER_COLORS[i % TIER_COLORS.length] }} />
                <span className="text-text-muted">{t.name}</span>
                <span className="font-bold ml-auto">{t.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-surface rounded-2xl border border-border p-6 lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-500" /> Recent Campaigns
            </h3>
            <Link to="/campaigns" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-surfaceHighlight/50 text-xs uppercase tracking-wider text-text-muted border-b border-border">
                  <th className="px-4 py-3 font-semibold">Campaign</th>
                  <th className="px-4 py-3 font-semibold">Channel</th>
                  <th className="px-4 py-3 font-semibold text-right">Reach</th>
                  <th className="px-4 py-3 font-semibold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentCampaigns.map((c: any) => (
                  <tr key={c.id} className="hover:bg-surfaceHighlight/40 transition-colors group">
                    <td className="px-4 py-3.5">
                      <Link to={`/campaigns/${c.id}`}>
                        <div className="font-semibold text-sm group-hover:text-primary transition-colors truncate max-w-[160px]">{c.name}</div>
                        <div className="text-xs text-text-muted mt-0.5">{format(new Date(c.createdAt), 'MMM d, yyyy')}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold uppercase px-2 py-1 rounded-lg border border-border bg-surfaceHighlight text-text-muted"
                        style={{ borderColor: CHANNEL_COLORS[c.channel] + '40', color: CHANNEL_COLORS[c.channel] }}>
                        {c.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-text-muted">
                      {(c.reach || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                      ₹{(c.revenue || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {recentCampaigns.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-text-muted text-sm">
                      No campaigns yet.{' '}
                      <Link to="/agent" className="text-primary font-semibold hover:underline">Draft one with AI</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Churn Alert Strip ── */}
      {churnAlerts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h3 className="font-bold text-sm text-rose-700 flex items-center gap-2">
                <HeartPulse className="w-4 h-4" /> Churn Risk Alerts
              </h3>
            </div>
            <Link to="/churn" className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {churnAlerts.map((c: any) => {
              const zone = c.health.zone
              const score = c.health.score
              const color = zone === 'churning' ? '#f43f5e' : '#f59e0b'
              const radius = 18
              const circ = 2 * Math.PI * radius
              const dash = (score / 100) * circ
              return (
                <Link
                  key={c.id}
                  to={`/customers/${c.id}`}
                  className="flex items-center gap-3 bg-white border border-rose-200 rounded-xl p-3 hover:shadow-sm transition-all group"
                >
                  <svg width={44} height={44} className="-rotate-90 shrink-0">
                    <circle cx={22} cy={22} r={radius} fill="none" stroke="#fecdd3" strokeWidth={5} />
                    <circle cx={22} cy={22} r={radius} fill="none" stroke={color} strokeWidth={5}
                      strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                      style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs truncate group-hover:text-rose-600 transition-colors">{c.name}</div>
                    <div className="text-[10px] text-text-muted">{c.membershipTier} · Score {score}/100</div>
                    <div className="text-[10px] text-rose-500 font-medium mt-0.5 truncate">{c.recommendedAction}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
