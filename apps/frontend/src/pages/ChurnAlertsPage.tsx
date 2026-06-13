import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Activity, AlertTriangle, CheckCircle2, TrendingDown,
  Users, IndianRupee, Calendar, Zap, ChevronRight,
  RefreshCw, ShoppingBag, Clock
} from 'lucide-react'
import Skeleton from '../components/Skeleton'

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAvatarColor(name: string) {
  const colors = ['bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500']
  return colors[name.charCodeAt(0) % colors.length]
}

function getInitials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
}

function getZoneDot(zone: string) {
  if (zone === 'healthy') return 'bg-emerald-500'
  if (zone === 'at_risk') return 'bg-amber-400'
  return 'bg-rose-500'
}

function getScoreColor(score: number) {
  if (score >= 70) return '#10b981'
  if (score >= 40) return '#f59e0b'
  return '#f43f5e'
}

// ── Circular Score Badge ──────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = getScoreColor(score)
  const radius = 18
  const circ = 2 * Math.PI * radius
  const dash = (score / 100) * circ
  return (
    <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
      <svg width={44} height={44} className="-rotate-90">
        <circle cx={22} cy={22} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={4} />
        <circle cx={22} cy={22} r={radius} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  )
}

// ── Alert Card (clean, minimal) ───────────────────────────────────────────────
function AlertCard({ customer, onAction }: { customer: any; onAction: (c: any) => void }) {
  const zone = customer.health.zone
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-surface border border-border rounded-2xl hover:shadow-sm transition-all duration-200">
      <div className="p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-xl ${getAvatarColor(customer.name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
            {getInitials(customer.name)}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Link to={`/customers/${customer.id}`} className="font-semibold text-sm hover:text-primary transition-colors">
                {customer.name}
              </Link>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getZoneDot(zone)}`} />
              <span className="text-[11px] text-text-muted">
                {zone === 'churning' ? 'Churning' : 'At Risk'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-text-muted">
              <span>{customer.membershipTier}</span>
              <span>·</span>
              <span>₹{customer.totalSpend.toLocaleString()}</span>
              <span>·</span>
              <span>{customer.orderCount} orders</span>
              {customer.daysSinceOrder !== null && (
                <>
                  <span>·</span>
                  <span>{customer.daysSinceOrder}d inactive</span>
                </>
              )}
            </div>
          </div>

          {/* Score gauge */}
          <ScoreBadge score={customer.health.score} />

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onAction(customer)}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-hover transition-colors"
            >
              Take Action
            </button>
            <button
              onClick={() => setExpanded(e => !e)}
              className={`p-1.5 rounded-lg border border-border text-text-muted hover:text-text transition-colors ${expanded ? 'bg-surfaceHighlight' : ''}`}
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {/* Suggestion — shown inline, no background */}
        <div className="mt-3 ml-14 flex items-center gap-1.5 text-[11px] text-text-muted">
          <Zap className="w-3 h-3 shrink-0" />
          <span>{customer.recommendedAction}</span>
        </div>

        {/* Expandable breakdown */}
        {expanded && (
          <div className="mt-4 ml-14 pt-4 border-t border-border grid grid-cols-4 gap-4">
            {[
              { label: 'Recency', score: customer.health.breakdown.recency.score, max: 35 },
              { label: 'Engagement', score: customer.health.breakdown.engagement.score, max: 30 },
              { label: 'Spend', score: customer.health.breakdown.spendTrajectory.score, max: 20 },
              { label: 'Frequency', score: customer.health.breakdown.frequency.score, max: 15 },
            ].map(b => (
              <div key={b.label}>
                <div className="flex justify-between text-[10px] text-text-muted mb-1">
                  <span>{b.label}</span>
                  <span className="font-semibold">{b.score}/{b.max}</span>
                </div>
                <div className="w-full h-1 rounded-full bg-border">
                  <div
                    className="h-1 rounded-full bg-primary"
                    style={{ width: `${(b.score / b.max) * 100}%`, transition: 'width 0.8s ease' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ChurnAlertsPage() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'churning' | 'at_risk'>('all')

  const load = () => {
    setLoading(true)
    Promise.all([
      axios.get('/api/customer-health/overview'),
      axios.get('/api/customer-health/alerts'),
    ])
      .then(([ov, al]) => {
        setOverview(ov.data)
        setAlerts(al.data.alerts)
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.health.zone === filter)

  const handleAction = (customer: any) => {
    navigate(`/agent?prompt=${encodeURIComponent(`Target exactly this customer by name: ${customer.name} for a personalised win-back ${customer.membershipTier !== 'None' ? 'email' : 'SMS'}. They last ordered ${customer.daysSinceOrder ?? 'a while'} days ago and are a ${customer.membershipTier} member.`)}`)
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Relationship Health</h2>
          <p className="text-text-muted text-sm mt-1">AI-scored customer health · spot churn before it happens</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI row */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Avg Health Score', value: `${overview.avgScore}`, sub: '/ 100', icon: Activity, dot: null },
            { label: 'Healthy', value: overview.healthy, sub: 'customers', icon: CheckCircle2, dot: 'bg-emerald-500' },
            { label: 'At Risk', value: overview.atRisk, sub: 'customers', icon: AlertTriangle, dot: 'bg-amber-400' },
            { label: 'Churning', value: overview.churning, sub: 'customers', icon: TrendingDown, dot: 'bg-rose-500' },
          ].map(card => {
            const Icon = card.icon
            return (
              <div key={card.label} className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  {card.dot && <span className={`w-2 h-2 rounded-full ${card.dot}`} />}
                  <span className="text-xs text-text-muted font-medium">{card.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold">{card.value}</span>
                  <span className="text-xs text-text-muted">{card.sub}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Distribution bar */}
      {!loading && overview && overview.total > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Health Distribution</span>
            <span className="text-xs text-text-muted">{overview.total} customers scored</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            <div className="bg-emerald-500 rounded-l-full" style={{ width: `${(overview.healthy / overview.total) * 100}%` }} title={`Healthy: ${overview.healthy}`} />
            <div className="bg-amber-400" style={{ width: `${(overview.atRisk / overview.total) * 100}%` }} title={`At Risk: ${overview.atRisk}`} />
            <div className="bg-rose-500 rounded-r-full" style={{ width: `${(overview.churning / overview.total) * 100}%` }} title={`Churning: ${overview.churning}`} />
          </div>
          <div className="flex items-center gap-5 mt-2 text-[11px] text-text-muted">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Healthy (70–100)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />At Risk (40–69)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Churning (0–39)</span>
          </div>
        </div>
      )}

      {/* Alert list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-base">Churn Alerts</h3>
            {!loading && <p className="text-xs text-text-muted mt-0.5">{filtered.length} customers need attention</p>}
          </div>
          <div className="flex items-center bg-surfaceHighlight border border-border rounded-lg overflow-hidden text-xs">
            {(['all', 'churning', 'at_risk'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 font-medium transition-colors ${filter === f ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}
              >
                {f === 'all' ? 'All' : f === 'churning' ? 'Churning' : 'At Risk'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-surface border border-border rounded-2xl text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
            <p className="font-semibold">All clear</p>
            <p className="text-text-muted text-sm mt-1">No customers in this risk category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(customer => (
              <AlertCard key={customer.id} customer={customer} onAction={handleAction} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
