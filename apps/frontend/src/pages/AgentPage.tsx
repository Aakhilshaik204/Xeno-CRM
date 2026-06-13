import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import * as LucideIcons from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import {
  Send, Bot, Loader2, Sparkles, Trash2,
  TrendingUp, IndianRupee, Users, BarChart3, GitCompare,
  Mail, MessageSquare, Zap, Activity, CheckCircle2,
  AlertTriangle, Eye, MousePointerClick, Shield,
  ChevronRight, FileText, Rocket, Sparkle, LayoutPanelLeft
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts'
import { ChartPanel } from '../components/ChartPanel'
import { XenoLogo } from '../components/XenoLogo'

// ── Quick chips ──────────────────────────────────────────────
const FALLBACK_CHIPS = [
  { icon: 'TrendingUp',    label: 'Predict outcome for Gold Member email',   prompt: 'Predict the outcome if I send an email campaign to Gold Members' },
  { icon: 'IndianRupee',   label: 'Generate full revenue report',    prompt: 'Generate a full revenue report for all campaigns' },
  { icon: 'Mail',          label: 'Draft an email for Gold Members',prompt: 'Draft an email campaign for Gold Members offering a free accessory' },
  { icon: 'Zap',           label: 'Segment high spenders > ₹50k',    prompt: 'Create a segment for customers who spent over ₹50,000' },
]

// ── Markdown renderer ────────────────────────────────────────
function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ ...p }) => <h1 className="text-lg font-bold mt-3 mb-1.5" {...p} />,
        h2: ({ ...p }) => <h2 className="text-base font-bold mt-3 mb-1.5" {...p} />,
        h3: ({ ...p }) => <h3 className="text-sm font-bold mt-2 mb-1" {...p} />,
        p: ({ ...p }) => <p className="mb-2 last:mb-0 leading-relaxed text-sm" {...p} />,
        ul: ({ ...p }) => <ul className="list-disc pl-5 mb-2 space-y-0.5 text-sm" {...p} />,
        ol: ({ ...p }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5 text-sm" {...p} />,
        li: ({ ...p }) => <li className="leading-relaxed" {...p} />,
        strong: ({ ...p }) => <strong className="font-semibold" {...p} />,
        table: ({ ...p }) => (
          <div className="overflow-x-auto my-3 rounded-xl border border-border">
            <table className="w-full text-sm border-collapse" {...p} />
          </div>
        ),
        thead: ({ ...p }) => <thead className="bg-surfaceHighlight" {...p} />,
        th: ({ ...p }) => <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border" {...p} />,
        td: ({ ...p }) => <td className="px-4 py-2.5 border-b border-border/60 last:border-0" {...p} />,
        tr: ({ ...p }) => <tr className="hover:bg-surfaceHighlight/50 transition-colors" {...p} />,
        code: ({ ...p }) => <code className="bg-surfaceHighlight px-1.5 py-0.5 rounded text-xs font-mono" {...p} />,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// ── Prediction Panel ─────────────────────────────────────────
function PredictionPanel({ data }: { data: any }) {
  const p = data.predicted
  const openPct = parseFloat(p.openRate)
  const convPct = parseFloat(p.conversionRate)
  const riskColor = p.riskLevel === 'Low' ? 'text-emerald-600 bg-emerald-50' : p.riskLevel === 'Medium' ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50'
  const channelColor: Record<string, string> = { email: 'text-blue-600', sms: 'text-purple-600', whatsapp: 'text-green-600', rcs: 'text-amber-600' }

  const barData = [
    { name: 'Audience', value: data.audienceSize, fill: '#94a3b8' },
    { name: 'Est. Opens', value: p.opens, fill: '#3b82f6' },
    { name: 'Est. Conversions', value: p.conversions, fill: '#a855f7' },
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header row */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Campaign Prediction</h2>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className={`text-xs font-bold capitalize px-2 py-0.5 rounded-full bg-surfaceHighlight border border-border ${channelColor[data.channel] || 'text-text'}`}>{data.channel}</span>
            <span className="text-xs text-text-muted">→</span>
            <span className="text-xs font-bold">{data.segment}</span>
            <span className="text-xs text-text-muted">({data.audienceSize.toLocaleString()} customers)</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center gap-1.5 text-blue-600 mb-2"><Eye className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wider">Open Rate</span></div>
          <div className="text-3xl font-extrabold text-blue-700">{p.openRate}</div>
          <div className="text-sm font-medium text-blue-500">~{p.opens.toLocaleString()} opens</div>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center gap-1.5 text-violet-600 mb-2"><MousePointerClick className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wider">Conversion</span></div>
          <div className="text-3xl font-extrabold text-violet-700">{p.conversionRate}</div>
          <div className="text-sm font-medium text-violet-500">~{p.conversions.toLocaleString()} orders</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center gap-1.5 text-amber-600 mb-2"><IndianRupee className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wider">Revenue</span></div>
          <div className="text-3xl font-extrabold text-amber-700">₹{p.estimatedRevenue.toLocaleString()}</div>
          <div className="text-sm font-medium text-amber-500">₹{p.revenuePerSend}/send</div>
        </div>
        <div className={`border rounded-xl p-5 flex flex-col gap-1 shadow-sm ${riskColor}`}>
          <div className="flex items-center gap-1.5 mb-2 opacity-80"><Shield className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-wider">Risk Level</span></div>
          <div className="text-3xl font-extrabold">{p.riskLevel}</div>
          <div className="text-sm font-medium opacity-70">Based on {data.basedOnCampaigns} past campaigns</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Progress bars */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-5">
          <h4 className="text-sm font-bold text-text mb-2">Rate Breakdown</h4>
          <div className="space-y-4">
            {[
              { label: 'Open Rate', value: openPct, color: 'bg-blue-500', bg: 'bg-blue-100' },
              { label: 'Conversion Rate', value: convPct, color: 'bg-violet-500', bg: 'bg-violet-100' },
              { label: 'Est. Delivery Rate', value: Math.min(openPct * 1.3, 100), color: 'bg-emerald-500', bg: 'bg-emerald-100' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-text-muted font-medium">{item.label}</span>
                  <span className="font-bold">{item.value.toFixed(1)}%</span>
                </div>
                <div className={`w-full h-3 rounded-full ${item.bg}`}>
                  <div
                    className={`h-3 rounded-full ${item.color} transition-all duration-1000`}
                    style={{ width: `${Math.min(item.value, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audience funnel bars */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h4 className="text-sm font-bold text-text mb-4">Predicted Funnel</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', fontSize: 13, borderRadius: 8 }}
                formatter={(v: number) => [v.toLocaleString()]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ── Draft Panel ──────────────────────────────────────────────
function DraftPanel({ data, onRun }: { data: any; onRun: (prompt: string) => void }) {
  const { campaign, prediction, suggestions } = data
  const p = prediction
  const riskColor = p.riskLevel === 'Low' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : p.riskLevel === 'Medium' ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-rose-600 bg-rose-50 border-rose-200'
  const channelColor: Record<string, string> = { email: 'bg-blue-100 text-blue-700', sms: 'bg-purple-100 text-purple-700', whatsapp: 'bg-green-100 text-green-700', rcs: 'bg-amber-100 text-amber-700' }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header row */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
          <Mail className="w-5 h-5 text-sky-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Campaign Draft</h2>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className={`text-xs font-bold capitalize px-2 py-0.5 rounded-full ${channelColor[campaign.channel] || 'bg-slate-100 text-slate-700'}`}>{campaign.channel}</span>
            <span className="text-sm font-semibold">{campaign.name}</span>
            <span className="text-text-muted">→</span>
            <span className="text-sm text-text-muted">{campaign.segmentName} ({campaign.audienceSize.toLocaleString()} customers)</span>
          </div>
        </div>
      </div>

      {/* Message Preview */}
      <div className="bg-surfaceHighlight/50 border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-1.5 mb-3">
          <FileText className="w-4 h-4 text-text-muted" />
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Message Template</span>
        </div>
        <p className="text-base text-text leading-relaxed whitespace-pre-wrap">{campaign.messageTemplate}</p>
      </div>

      {/* Prediction KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-blue-600 mb-1"><Eye className="w-3.5 h-3.5" /><span className="text-[10px] font-bold uppercase">Open Rate</span></div>
          <div className="text-2xl font-extrabold text-blue-700">{p.openRate}%</div>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-violet-600 mb-1"><MousePointerClick className="w-3.5 h-3.5" /><span className="text-[10px] font-bold uppercase">Conversion</span></div>
          <div className="text-2xl font-extrabold text-violet-700">{p.conversionRate}%</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-amber-600 mb-1"><IndianRupee className="w-3.5 h-3.5" /><span className="text-[10px] font-bold uppercase">Revenue</span></div>
          <div className="text-2xl font-extrabold text-amber-700">₹{p.estimatedRevenue.toLocaleString()}</div>
        </div>
        <div className={`border rounded-xl p-4 shadow-sm ${riskColor}`}>
          <div className="flex items-center gap-1.5 mb-1"><Shield className="w-3.5 h-3.5" /><span className="text-[10px] font-bold uppercase">Risk</span></div>
          <div className="text-2xl font-extrabold">{p.riskLevel}</div>
        </div>
      </div>

      {/* Follow-up actions */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Suggested Next Steps</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((s: any, i: number) => (
            <button
              key={i}
              onClick={() => onRun(s.prompt)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-sm font-semibold border transition-all hover:shadow-md hover:-translate-y-0.5 ${
                i === 0
                  ? 'bg-primary text-white border-primary hover:bg-primary-hover'
                  : 'bg-surface border-border text-text hover:border-primary/40 hover:bg-surfaceHighlight'
              }`}
            >
              {i === 0 ? <Rocket className="w-4 h-4 shrink-0" /> : <Sparkles className="w-4 h-4 text-primary shrink-0" />}
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Data Grid Panel ───────────────────────────────────────────
function DataGridPanel({ data }: { data: { title: string, columns: string[], rows: any[][] } }) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto h-full flex flex-col">
      {/* Header row */}
      <div className="flex items-center gap-3 pb-4 border-b border-border shrink-0">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{data.title || 'Data Grid'}</h2>
          <div className="text-sm text-text-muted mt-0.5">{data.rows.length} records found</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1 min-h-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-surfaceHighlight sticky top-0 z-10 shadow-sm">
              <tr>
                {data.columns.map((col, i) => (
                  <th key={i} className="px-5 py-3.5 text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-surfaceHighlight/30 transition-colors">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-5 py-3.5 text-text whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr>
                  <td colSpan={data.columns.length} className="px-5 py-8 text-center text-text-muted">
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Types ──────────────────────────────────────────────
type Status = 'running' | 'done' | 'error'
type Result = {
  id: string
  prompt: string
  reply: string
  actions: { name: string; description: string; args: Record<string, unknown> }[]
  structured: { type: string; data: any } | null
  status: Status
  ts: Date
  onRun: (prompt: string) => void
}

// ── Main Split-Pane Page ────────────────────────────────────────────────
export default function AgentPage() {
  const [results, setResults] = useState<Result[]>([])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [chips, setChips] = useState<any[]>([])
  const [chipsLoading, setChipsLoading] = useState(true)
  
  const runningRef = useRef(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  // Pre-fill from ?prompt= URL param (e.g., from Churn Alerts "Take Action")
  useEffect(() => {
    const p = searchParams.get('prompt')
    if (p) {
      setInput(p)
      setSearchParams({}, { replace: true })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [])

  useEffect(() => {
    const fetchChips = async () => {
      try {
        const { data } = await axios.get('/api/agent/recommendations')
        if (data && Array.isArray(data) && data.length > 0) {
          setChips(data)
        }
      } catch (err) {
        console.error('Failed to fetch dynamic chips:', err)
      } finally {
        setChipsLoading(false)
      }
    }
    fetchChips()
    const interval = setInterval(fetchChips, 300000)
    return () => clearInterval(interval)
  }, [])

  // Auto scroll to bottom of chat when new results come in
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [results, running])

  const run = async (prompt: string) => {
    const text = prompt.trim()
    if (!text || runningRef.current) return
    runningRef.current = true
    setRunning(true)
    setInput('')

    const id = crypto.randomUUID()
    const newResult: Result = { id, prompt: text, reply: '', actions: [], structured: null, status: 'running', ts: new Date(), onRun: run }
    setResults(prev => [...prev, newResult])

    try {
      const history = results.slice(-4).map(r => [
        { role: 'user' as const, content: r.prompt },
        { role: 'agent' as const, content: r.reply }
      ]).flat()

      const res = await axios.post('/api/agent/chat', { prompt: text, history })
      setResults(prev => prev.map(r =>
        r.id === id ? {
          ...r,
          reply: res.data.reply,
          actions: res.data.actions || [],
          structured: res.data.structured || null,
          status: 'done',
          onRun: run
        } : r
      ))
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string }
      setResults(prev => prev.map(r =>
        r.id === id ? { ...r, reply: error.response?.data?.error || error.message || 'Error', status: 'error' } : r
      ))
    } finally {
      runningRef.current = false
      setRunning(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  return (
    <div className="flex h-full w-full animate-fade-in p-6 bg-[#f8f9fa] gap-6 overflow-hidden text-slate-800">
      
      {/* ── LEFT SIDEBAR ── */}
      <div className="w-[320px] shrink-0 flex flex-col gap-6 overflow-y-auto scrollbar-none pb-10">
        
        {/* Agent Info Card */}
        <div className="bg-indigo-50 border border-indigo-100/50 rounded-2xl p-5 shadow-sm relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/40 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <XenoLogo className="w-12 h-12 shrink-0 object-contain rounded-xl shadow-sm" />
            <div>
              <h2 className="font-extrabold text-base tracking-tight text-indigo-900">AI Campaign Agent</h2>
              <div className="text-[10px] font-medium text-indigo-600/80 uppercase tracking-wider mt-0.5">Autonomous Engine</div>
            </div>
          </div>
          <p className="text-sm text-indigo-900/70 leading-relaxed relative z-10">
            Describe your marketing goal in plain English. The agent will autonomously segment, draft, launch, and report.
          </p>
        </div>

        {/* Capabilities Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Capabilities</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <Users className="w-4 h-4 text-indigo-500" /> Customer Segmentation
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <MessageSquare className="w-4 h-4 text-emerald-500" /> AI Copywriting
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <Zap className="w-4 h-4 text-amber-500" /> Auto Campaign Launch
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <TrendingUp className="w-4 h-4 text-violet-500" /> Revenue Analytics
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <Activity className="w-4 h-4 text-rose-500" /> Segment Targeting
            </div>
          </div>
        </div>

        {/* Quick Start Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Quick Start</h3>
          <div className="flex flex-col gap-3">
            {chipsLoading && chips.length === 0 ? (
              [1, 2, 3].map(i => <div key={i} className="h-12 w-full bg-slate-50 animate-pulse rounded-xl shrink-0 border border-slate-100" />)
            ) : (
              (chips.length > 0 ? chips : FALLBACK_CHIPS).map(chip => {
                return (
                  <button
                    key={chip.prompt}
                    onClick={() => run(chip.prompt)}
                    disabled={running}
                    className="text-left px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors disabled:opacity-50"
                  >
                    {chip.prompt}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT MAIN AREA ── */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 h-full">
        
        {/* Input Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex-shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Marketing Goal</h3>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => !running && setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  run(input)
                }
              }}
              readOnly={running}
              placeholder="e.g. 'Win back customers who have not ordered in 60 days with a WhatsApp message'"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 shadow-inner transition-all text-slate-800 placeholder:text-slate-400 resize-none h-28"
            />
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-400">Cmd + Enter to run</span>
            <button
              onClick={() => run(input)}
              disabled={running || !input.trim()}
              className="px-6 py-2 bg-indigo-200/50 hover:bg-indigo-200 text-indigo-700 font-semibold rounded-xl text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" /> Run Agent
            </button>
          </div>
        </div>

        {/* Output Feed */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {results.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <p className="text-sm font-semibold text-slate-500">Agent output will appear here</p>
                <p className="text-xs text-slate-400 mt-1">Type a goal on the left or pick a quick start example</p>
              </div>
            ) : (
              results.map(r => (
                <div key={r.id} className="space-y-4">
                  {/* User Goal Header */}
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
                    <div className="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <Send className="w-3 h-3" />
                    </div>
                    {r.prompt}
                  </div>

                  {/* Agent Response Area */}
                  <div className="pl-8 space-y-4">
                    {/* Tool logs */}
                    {r.actions.length > 0 && (
                      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                        <Activity className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          {r.actions.map((a, i) => (
                            <span key={i} className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              {a.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Thinking */}
                    {r.status === 'running' && (
                      <div className="flex items-center gap-2 py-2">
                        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                        <span className="text-slate-500 text-xs font-medium">Generating response...</span>
                      </div>
                    )}

                    {/* Error */}
                    {r.status === 'error' && (
                      <div className="text-rose-600 text-xs flex items-start gap-1.5 bg-rose-50 p-3 rounded-lg border border-rose-100">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        {r.reply}
                      </div>
                    )}

                    {/* Reply Text */}
                    {r.status === 'done' && r.reply && (
                      <div className="prose prose-sm prose-slate max-w-none text-slate-700">
                        <Markdown content={r.reply} />
                      </div>
                    )}

                    {/* Inline Deliverable */}
                    {r.status === 'done' && r.structured && (
                      <div className="mt-4 border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                        <div className="p-4">
                          {r.structured.type === 'draft' && <DraftPanel data={r.structured.data} onRun={run} />}
                          {r.structured.type === 'prediction' && <PredictionPanel data={r.structured.data} />}
                          {r.structured.type === 'datagrid' && <DataGridPanel data={r.structured.data} />}
                          {r.structured.type === 'chart' && <ChartPanel data={r.structured.data} />}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
