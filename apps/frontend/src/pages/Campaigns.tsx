import { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { Link, useNavigate } from 'react-router-dom'
import {
  Send, PlayCircle, CheckCircle2, AlertCircle, GitCompare,
  X, BarChart3, IndianRupee, Users, MousePointerClick,
  TrendingUp, Mail, MessageSquare, ChevronRight, Pencil,
  Trash2, Clock, CalendarClock, Plus, Check
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, Legend
} from 'recharts'
import EditCampaignDrawer from '../components/EditCampaignDrawer'

// ── Colour palette for compare mode ─────────────────────────
const PALETTE = [
  { bar: '#6366f1', bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200' },
  { bar: '#f59e0b', bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200'  },
  { bar: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200'},
  { bar: '#ec4899', bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-200'   },
]

// ── Status badge ─────────────────────────────────────────────
function StatusBadge({ status, scheduledAt }: { status: string; scheduledAt?: string }) {
  switch (status) {
    case 'draft':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surfaceHighlight text-text-muted border border-border"><AlertCircle className="w-3 h-3" /> Draft</span>
    case 'scheduled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <CalendarClock className="w-3 h-3" />
          {scheduledAt ? `Scheduled · ${format(new Date(scheduledAt), 'MMM d, h:mm a')}` : 'Scheduled'}
        </span>
      )
    case 'sending':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200"><PlayCircle className="w-3 h-3 animate-pulse" /> Sending</span>
    case 'sent':
    case 'completed':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Completed</span>
    default:
      return <span className="text-xs text-text-muted">{status}</span>
  }
}

function ChannelBadge({ channel }: { channel: string }) {
  const Icon = channel === 'email' ? Mail : MessageSquare
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase px-2 py-0.5 rounded bg-surfaceHighlight border border-border text-text-muted">
      <Icon className="w-3 h-3" /> {channel}
    </span>
  )
}

// ── Compare panel (same as before) ──────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-bold text-text mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-text-muted">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function ComparePanel({ selected, campaigns, onClose }: { selected: string[]; campaigns: any[]; onClose: () => void }) {
  const items = selected.map((id, i) => ({ ...campaigns.find(c => c.id === id), palette: PALETTE[i % PALETTE.length] })).filter(Boolean)
  const safeRate = (num: number, den: number) => den > 0 ? parseFloat(((num / den) * 100).toFixed(1)) : 0

  const metricsData = [
    { metric: 'Delivered', ...Object.fromEntries(items.map(c => [c.name, c.stats?.delivered ?? 0])) },
    { metric: 'Opened',    ...Object.fromEntries(items.map(c => [c.name, c.stats?.opened ?? 0])) },
    { metric: 'Clicked',   ...Object.fromEntries(items.map(c => [c.name, c.stats?.clicked ?? 0])) },
    { metric: 'Converted', ...Object.fromEntries(items.map(c => [c.name, c.stats?.converted ?? 0])) },
  ]
  const rateData = [
    { metric: 'Delivery %',   ...Object.fromEntries(items.map(c => [c.name, safeRate(c.stats?.delivered, c.stats?.total)])) },
    { metric: 'Open %',       ...Object.fromEntries(items.map(c => [c.name, safeRate(c.stats?.opened, c.stats?.delivered)])) },
    { metric: 'Click %',      ...Object.fromEntries(items.map(c => [c.name, safeRate(c.stats?.clicked, c.stats?.opened)])) },
    { metric: 'Conversion %', ...Object.fromEntries(items.map(c => [c.name, safeRate(c.stats?.converted, c.stats?.total)])) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center"><GitCompare className="w-5 h-5 text-indigo-600" /></div>
          <div><h3 className="font-bold text-lg">Campaign Comparison</h3><p className="text-xs text-text-muted">{items.length} campaigns selected</p></div>
        </div>
        <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-muted border border-border rounded-xl hover:bg-surfaceHighlight transition-colors">
          <X className="w-4 h-4" /> Exit Compare
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(c => (
          <div key={c.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${c.palette.bg} ${c.palette.border} ${c.palette.text}`}>
            <div className="w-2 h-2 rounded-full" style={{ background: c.palette.bar }} />{c.name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-500" /> Message Funnel</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={metricsData} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
              {items.map(c => <Bar key={c.id} dataKey={c.name} fill={c.palette.bar} radius={[4,4,0,0]} maxBarSize={32} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" /> Performance Radar</h4>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={rateData}>
              <PolarGrid stroke="#e2e8f0" /><PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {items.map(c => <Radar key={c.id} name={c.name} dataKey={c.name} stroke={c.palette.bar} fill={c.palette.bar} fillOpacity={0.15} />)}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-surfaceHighlight/50"><h4 className="font-bold text-sm">Full Metrics Breakdown</h4></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surfaceHighlight/30 border-b border-border">
              <tr className="text-xs uppercase tracking-wider text-text-muted">
                <th className="px-6 py-3.5 text-left font-semibold">Metric</th>
                {items.map(c => <th key={c.id} className="px-6 py-3.5 text-right font-semibold"><div className="flex items-center justify-end gap-2"><div className="w-2 h-2 rounded-full" style={{ background: c.palette.bar }} />{c.name}</div></th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { label: 'Audience Size',   fn: (c: any) => (c.stats?.total ?? 0).toLocaleString() },
                { label: 'Delivered',       fn: (c: any) => (c.stats?.delivered ?? 0).toLocaleString() },
                { label: 'Delivery Rate',   fn: (c: any) => safeRate(c.stats?.delivered, c.stats?.total) + '%' },
                { label: 'Opened',          fn: (c: any) => (c.stats?.opened ?? 0).toLocaleString() },
                { label: 'Open Rate',       fn: (c: any) => safeRate(c.stats?.opened, c.stats?.delivered) + '%' },
                { label: 'Converted',       fn: (c: any) => (c.stats?.converted ?? 0).toLocaleString() },
                { label: 'Conversion Rate', fn: (c: any) => safeRate(c.stats?.converted, c.stats?.total) + '%' },
                { label: 'Revenue',         fn: (c: any) => `₹${(c.stats?.revenue ?? 0).toLocaleString()}` },
              ].map(row => (
                <tr key={row.label} className="hover:bg-surfaceHighlight/30 transition-colors">
                  <td className="px-6 py-3.5 text-text-muted font-medium">{row.label}</td>
                  {items.map(c => <td key={c.id} className="px-6 py-3.5 text-right font-semibold">{row.fn(c)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Main Campaigns Page ──────────────────────────────────────
export default function Campaigns() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [comparing, setComparing] = useState(false)
  const [editCampaign, setEditCampaign] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchCampaigns() }, [])

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get('/api/campaigns')
      setCampaigns(res.data.campaigns)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleDispatch = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    if (!confirm('Dispatch this campaign now?')) return
    await axios.post(`/api/campaigns/${id}/dispatch`)
    fetchCampaigns()
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      await axios.delete(`/api/campaigns/${id}`)
      setDeleteId(null)
      fetchCampaigns()
    } catch (e) { console.error(e) }
    finally { setDeleting(false) }
  }

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev)
  }

  const isEditable = (status: string) => ['draft', 'scheduled'].includes(status)

  if (comparing && selected.length >= 2) {
    return (
      <div className="space-y-6">
        <ComparePanel selected={selected} campaigns={campaigns} onClose={() => { setComparing(false); setSelected([]) }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Campaigns</h2>
          <p className="text-text-muted text-sm mt-0.5">Create, manage and compare your outreach campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          {selected.length > 0 && (
            <>
              <span className="text-xs text-text-muted font-medium">{selected.length} selected</span>
              <button onClick={() => setSelected([])} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 border border-border rounded-xl hover:bg-surfaceHighlight transition-colors text-text-muted">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
              {selected.length >= 2 && (
                <button onClick={() => setComparing(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  <GitCompare className="w-4 h-4" /> Compare {selected.length}
                </button>
              )}
            </>
          )}
          <button
            onClick={() => navigate('/campaigns/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>
      </div>

      {/* Compare hint */}
      {selected.length === 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <GitCompare className="w-4 h-4 text-indigo-600 shrink-0" />
          <p className="text-xs text-indigo-700 font-medium">Click the checkbox on any campaign to compare up to 4 campaigns side-by-side.</p>
        </div>
      )}

      {/* Campaign list */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center text-text-muted animate-pulse">Loading campaigns...</div>
        ) : (
          campaigns.map((c) => {
            const isSelected = selected.includes(c.id)
            const palette = PALETTE[selected.indexOf(c.id) % PALETTE.length]
            const editable = isEditable(c.status)
            return (
              <div
                key={c.id}
                className={`bg-surface border rounded-2xl transition-all duration-200 ${isSelected ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-border hover:border-slate-300'}`}
              >
                <div className="p-5 flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={e => toggleSelect(e, c.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-border hover:border-indigo-400 bg-surface'}`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/campaigns/${c.id}`} className="group block">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: palette?.bar }} />}
                            <h3 className="font-bold text-base group-hover:text-primary transition-colors truncate">{c.name}</h3>
                            <StatusBadge status={c.status} scheduledAt={c.scheduledAt} />
                            <ChannelBadge channel={c.channel} />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                            <span>Segment: <strong className="text-text">{c.segment?.name || 'Unknown'}</strong></span>
                            <span>{format(new Date(c.createdAt), 'MMM d, yyyy')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {c.status === 'draft' && (
                            <button onClick={e => handleDispatch(e, c.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white font-semibold rounded-lg transition-colors border border-primary/20 text-xs">
                              <PlayCircle className="w-3.5 h-3.5" /> Dispatch
                            </button>
                          )}
                          <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                        </div>
                      </div>

                      {/* Stats bar */}
                      {c.stats && (
                        <div className="mt-4 pt-4 border-t border-border grid grid-cols-5 gap-3">
                          {[
                            { label: 'Sent',      value: c.stats.total,     color: 'text-text'        },
                            { label: 'Delivered', value: c.stats.delivered, color: 'text-sky-600'     },
                            { label: 'Opened',    value: c.stats.opened,    color: 'text-violet-600'  },
                            { label: 'Converted', value: c.stats.converted, color: 'text-emerald-600' },
                            { label: 'Revenue',   value: `₹${(c.stats.revenue || 0).toLocaleString()}`, color: 'text-amber-600' },
                          ].map(s => (
                            <div key={s.label}>
                              <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">{s.label}</p>
                              <p className={`font-bold text-sm ${s.color}`}>{s.value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </Link>

                    {/* Edit / Delete buttons for draft & scheduled */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      {editable && (
                        <button
                          onClick={() => setEditCampaign(c)}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-surfaceHighlight transition-colors text-text-muted"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteId(c.id)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors text-rose-600"
                        title="Delete campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}

        {!loading && campaigns.length === 0 && (
          <div className="bg-surface border border-border rounded-2xl p-12 text-center">
            <Send className="w-10 h-10 text-text-muted opacity-30 mx-auto mb-4" />
            <p className="text-text-muted mb-4">No campaigns yet.</p>
            <button onClick={() => navigate('/campaigns/new')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors">
              <Plus className="w-4 h-4" /> Create Your First Campaign
            </button>
          </div>
        )}
      </div>

      {/* Edit Drawer */}
      {editCampaign && (
        <EditCampaignDrawer
          campaign={editCampaign}
          onClose={() => setEditCampaign(null)}
          onSaved={() => { setEditCampaign(null); fetchCampaigns() }}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-border shadow-2xl p-6 w-full max-w-sm">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="font-bold text-lg text-center mb-1">Delete Campaign?</h3>
              <p className="text-sm text-text-muted text-center mb-6">This will permanently delete the campaign and its custom segment (if any). This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-surfaceHighlight transition-colors">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} disabled={deleting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
