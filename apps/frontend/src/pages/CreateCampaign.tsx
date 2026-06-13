import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowLeft, ArrowRight, Check, MessageSquare, Mail,
  Smartphone, Radio, Users, UserCheck, Search, IndianRupee,
  MapPin, Send, Calendar, Clock, Loader2, ChevronDown, X
} from 'lucide-react'
import { format } from 'date-fns'

// ── Types ────────────────────────────────────────────────────
interface Segment { id: string; name: string; customerCount: number; description?: string }
interface Customer {
  id: string; name: string; email: string; city: string
  membershipTier: string; totalSpend: number; orderCount: number
}

// ── Constants ────────────────────────────────────────────────
const CHANNELS = [
  { id: 'sms',      label: 'SMS',       icon: Smartphone, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', active: 'bg-violet-600 text-white border-violet-600' },
  { id: 'whatsapp', label: 'WhatsApp',  icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', active: 'bg-emerald-600 text-white border-emerald-600' },
  { id: 'email',    label: 'Email',     icon: Mail, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', active: 'bg-sky-600 text-white border-sky-600' },
  { id: 'rcs',      label: 'RCS',       icon: Radio, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', active: 'bg-amber-600 text-white border-amber-600' },
]

const TIERS = ['All', 'Platinum', 'Gold', 'Silver', 'Bronze', 'None']

const STEPS = ['Basics', 'Audience', 'Message', 'Review']

// ── Step indicator ───────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
              i < current  ? 'bg-primary border-primary text-white'
              : i === current ? 'bg-white border-primary text-primary shadow-sm'
              : 'bg-surface border-border text-text-muted'
            }`}>
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm font-semibold hidden sm:block ${i === current ? 'text-primary' : i < current ? 'text-text' : 'text-text-muted'}`}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-3 rounded-full ${i < current ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────
export default function CreateCampaign() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [channel, setChannel] = useState('')
  const [audienceMode, setAudienceMode] = useState<'segment' | 'individual'>('segment')
  const [selectedSegmentId, setSelectedSegmentId] = useState('')
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([])
  const [messageTemplate, setMessageTemplate] = useState('')
  const [dispatchMode, setDispatchMode] = useState<'now' | 'draft' | 'schedule'>('draft')
  const [scheduledAt, setScheduledAt] = useState('')

  // Data
  const [segments, setSegments] = useState<Segment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('All')
  const [segmentSearch, setSegmentSearch] = useState('')
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  // Fetch segments
  useEffect(() => {
    axios.get('/api/audiences').then(r => setSegments(r.data.segments || []))
  }, [])

  // Fetch customers for individual mode
  useEffect(() => {
    if (audienceMode === 'individual' && customers.length === 0) {
      setLoadingCustomers(true)
      axios.get('/api/customers').then(r => {
        setCustomers(r.data.customers || [])
        setFilteredCustomers(r.data.customers || [])
      }).finally(() => setLoadingCustomers(false))
    }
  }, [audienceMode])

  // Filter customers
  useEffect(() => {
    let list = customers
    if (customerSearch) list = list.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email.toLowerCase().includes(customerSearch.toLowerCase()))
    if (tierFilter !== 'All') list = list.filter(c => c.membershipTier === tierFilter)
    setFilteredCustomers(list)
  }, [customerSearch, tierFilter, customers])

  const selectedSegment = segments.find(s => s.id === selectedSegmentId)
  const selectedCustomers = customers.filter(c => selectedCustomerIds.includes(c.id))

  const toggleCustomer = (id: string) => {
    setSelectedCustomerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const previewName = audienceMode === 'segment'
    ? (selectedCustomers[0]?.name || 'Priya Sharma')
    : (selectedCustomers[0]?.name || 'Customer')

  const previewMessage = messageTemplate.replace(/\{\{name\}\}/g, previewName)

  // Validation per step
  const canProceed = [
    name.trim() !== '' && channel !== '',
    audienceMode === 'segment' ? selectedSegmentId !== '' : selectedCustomerIds.length > 0,
    messageTemplate.trim() !== '',
    true
  ][step]

  const handleSubmit = async (mode: 'draft' | 'now' | 'schedule') => {
    setSaving(true); setError('')
    try {
      const body: any = { name, channel, messageTemplate }
      if (audienceMode === 'segment') body.segmentId = selectedSegmentId
      else body.customerIds = selectedCustomerIds
      if (mode === 'schedule' && scheduledAt) body.scheduledAt = new Date(scheduledAt).toISOString()

      const res = await axios.post('/api/campaigns', body)
      const campaignId = res.data.campaign.id

      if (mode === 'now') {
        await axios.post(`/api/campaigns/${campaignId}/dispatch`)
      }
      navigate('/campaigns')
    } catch (e: any) {
      setError(e.response?.data?.error || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/campaigns')}
          className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center hover:bg-surfaceHighlight transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {name.trim() ? name : 'New Campaign'}
          </h2>
          <p className="text-text-muted text-sm mt-0.5">
            {name.trim() ? 'New Campaign' : 'Create and send a campaign to your customers'}
          </p>
        </div>
      </div>

      {/* Step bar */}
      <StepBar current={step} />

      {/* ── Step 0: Basics ── */}
      {step === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Campaign Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Winter Sale Platinum Push"
              className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <p className="text-xs text-text-muted mt-1.5">This is for internal reference only — customers won't see it.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3">Channel</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CHANNELS.map(ch => {
                const Icon = ch.icon
                const isActive = channel === ch.id
                return (
                  <button
                    key={ch.id}
                    onClick={() => setChannel(ch.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                      isActive ? ch.active : `${ch.bg} ${ch.border} ${ch.color} hover:opacity-80`
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {ch.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Audience ── */}
      {step === 1 && (
        <div className="bg-surface border border-border rounded-2xl p-8 space-y-6">
          {/* Mode toggle */}
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setAudienceMode('segment')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${audienceMode === 'segment' ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:bg-surfaceHighlight'}`}
            >
              <Users className="w-4 h-4" /> Target a Segment
            </button>
            <button
              onClick={() => setAudienceMode('individual')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${audienceMode === 'individual' ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:bg-surfaceHighlight'}`}
            >
              <UserCheck className="w-4 h-4" /> Pick Individuals
            </button>
          </div>

          {/* Segment picker */}
          {audienceMode === 'segment' && (
            <div>
              <label className="block text-sm font-semibold mb-2">Select Segment</label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={segmentSearch}
                  onChange={e => setSegmentSearch(e.target.value)}
                  placeholder="Search segments..."
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {segments
                  .filter(s => s.name.toLowerCase().includes(segmentSearch.toLowerCase()))
                  .map(seg => (
                    <button
                      key={seg.id}
                      onClick={() => setSelectedSegmentId(seg.id)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-all ${
                        selectedSegmentId === seg.id
                          ? 'bg-primary/5 border-primary text-primary'
                          : 'border-border hover:border-slate-300 hover:bg-surfaceHighlight/40'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm">{seg.name}</div>
                        {seg.description && <div className="text-xs text-text-muted mt-0.5 line-clamp-1">{seg.description}</div>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold">{seg.customerCount.toLocaleString()} customers</span>
                        {selectedSegmentId === seg.id && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Individual picker */}
          {audienceMode === 'individual' && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <select
                  value={tierFilter}
                  onChange={e => setTierFilter(e.target.value)}
                  className="px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface"
                >
                  {TIERS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* Selected chips */}
              {selectedCustomerIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  {selectedCustomers.slice(0, 4).map(c => (
                    <span key={c.id} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-primary text-white rounded-full">
                      {c.name.split(' ')[0]}
                      <button onClick={() => toggleCustomer(c.id)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  {selectedCustomers.length > 4 && (
                    <span className="text-xs font-medium px-2.5 py-1 bg-surfaceHighlight border border-border rounded-full">+{selectedCustomers.length - 4} more</span>
                  )}
                  <span className="text-xs text-primary font-semibold self-center ml-1">{selectedCustomerIds.length} selected</span>
                </div>
              )}

              {loadingCustomers ? (
                <div className="flex items-center justify-center py-10 gap-2 text-text-muted text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading customers...
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surfaceHighlight/50 border-b border-border sticky top-0">
                      <tr className="text-[10px] uppercase tracking-wider text-text-muted">
                        <th className="w-10 px-4 py-2.5 text-left">
                          <input type="checkbox"
                            checked={filteredCustomers.length > 0 && filteredCustomers.every(c => selectedCustomerIds.includes(c.id))}
                            onChange={e => {
                              if (e.target.checked) setSelectedCustomerIds(prev => [...new Set([...prev, ...filteredCustomers.map(c => c.id)])])
                              else setSelectedCustomerIds(prev => prev.filter(id => !filteredCustomers.find(c => c.id === id)))
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="px-4 py-2.5 text-left font-semibold">Customer</th>
                        <th className="px-4 py-2.5 text-left font-semibold">Tier</th>
                        <th className="px-4 py-2.5 text-left font-semibold">City</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Spend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredCustomers.slice(0, 100).map(c => {
                        const checked = selectedCustomerIds.includes(c.id)
                        return (
                          <tr
                            key={c.id}
                            onClick={() => toggleCustomer(c.id)}
                            className={`cursor-pointer transition-colors ${checked ? 'bg-primary/5' : 'hover:bg-surfaceHighlight/40'}`}
                          >
                            <td className="px-4 py-2.5">
                              <input type="checkbox" checked={checked} readOnly className="rounded pointer-events-none" />
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="font-semibold text-xs">{c.name}</div>
                              <div className="text-[10px] text-text-muted">{c.email}</div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surfaceHighlight border border-border">{c.membershipTier}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="text-xs text-text-muted flex items-center gap-1"><MapPin className="w-3 h-3" />{c.city}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-emerald-600 text-xs">₹{c.totalSpend.toLocaleString()}</td>
                          </tr>
                        )
                      })}
                      {filteredCustomers.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted text-sm">No customers found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {audienceMode === 'individual' && name && selectedCustomerIds.length > 0 && (
                <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Auto-creates segment <strong>"Custom: {name}"</strong> with {selectedCustomerIds.length} customers
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Message ── */}
      {step === 2 && (
        <div className="bg-surface border border-border rounded-2xl p-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold">Message Template</label>
                <button
                  onClick={() => setMessageTemplate(t => t + '{{name}}')}
                  className="text-xs font-semibold text-primary border border-primary/30 bg-primary/5 px-2.5 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  + Insert {'{{name}}'}
                </button>
              </div>
              <textarea
                value={messageTemplate}
                onChange={e => setMessageTemplate(e.target.value)}
                placeholder={channel === 'email'
                  ? 'Subject: Exclusive offer for you\n\nDear {{name}},\n\nWe have something special...'
                  : 'Hi {{name}}, enjoy 15% off your next purchase at Maison Luxe. Shop now: [Link]'}
                rows={channel === 'email' ? 10 : 6}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-text-muted">Use <code className="bg-surfaceHighlight px-1 rounded">{'{{name}}'}</code> to personalise each message</p>
                <span className={`text-xs font-medium ${messageTemplate.length > 160 && channel === 'sms' ? 'text-amber-600' : 'text-text-muted'}`}>
                  {messageTemplate.length} chars
                </span>
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-semibold mb-2">Live Preview</label>
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-surfaceHighlight/50 border-b border-border flex items-center gap-2">
                  {(() => { const ch = CHANNELS.find(c => c.id === channel); if (!ch) return null; const Icon = ch.icon; return <><Icon className={`w-3.5 h-3.5 ${ch.color}`} /><span className={`text-xs font-semibold uppercase ${ch.color}`}>{ch.label}</span></> })()}
                  <span className="text-[10px] text-text-muted ml-auto">Previewing as: {previewName}</span>
                </div>
                <div className={`p-5 ${channel === 'email' ? 'min-h-[200px]' : 'min-h-[120px]'}`}>
                  {previewMessage ? (
                    <p className={`text-sm whitespace-pre-wrap leading-relaxed ${channel === 'email' ? 'font-serif' : ''}`}>
                      {previewMessage}
                    </p>
                  ) : (
                    <p className="text-sm text-text-muted italic">Start typing your message to see the preview...</p>
                  )}
                </div>
              </div>
              {channel === 'sms' && messageTemplate.length > 160 && (
                <p className="text-xs text-amber-600 font-medium mt-2">SMS messages over 160 chars may be split into 2 segments by carriers.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Review + Dispatch ── */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Summary card */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-text-muted uppercase tracking-wider">Campaign Summary</h3>
            {[
              { label: 'Name', value: name },
              { label: 'Channel', value: CHANNELS.find(c => c.id === channel)?.label || channel },
              {
                label: 'Audience',
                value: audienceMode === 'segment'
                  ? `${selectedSegment?.name} (${selectedSegment?.customerCount.toLocaleString()} customers)`
                  : `${selectedCustomerIds.length} individual customers → "Custom: ${name}"`
              },
            ].map(row => (
              <div key={row.label} className="flex gap-4 py-3 border-b border-border last:border-0">
                <span className="w-24 text-xs font-semibold text-text-muted shrink-0">{row.label}</span>
                <span className="text-sm font-medium">{row.value}</span>
              </div>
            ))}
            {/* Message preview */}
            <div className="flex gap-4 py-3">
              <span className="w-24 text-xs font-semibold text-text-muted shrink-0">Message</span>
              <div className="flex-1 text-sm bg-surfaceHighlight border border-border rounded-xl px-4 py-3 font-mono whitespace-pre-wrap line-clamp-4">
                {messageTemplate}
              </div>
            </div>
          </div>

          {/* Dispatch mode */}
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-text-muted uppercase tracking-wider">When to Send</h3>
            <div className="space-y-3">
              {([
                { mode: 'draft' as const, icon: Clock, label: 'Save as Draft', desc: 'Save without sending. Dispatch manually later.' },
                { mode: 'now' as const, icon: Send, label: 'Send Immediately', desc: 'Dispatch to all recipients right now.' },
                { mode: 'schedule' as const, icon: Calendar, label: 'Schedule for Later', desc: 'Pick a future date and time. Auto-dispatches.' },
              ] as const).map(opt => {
                const Icon = opt.icon
                return (
                  <label
                    key={opt.mode}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      dispatchMode === opt.mode ? 'border-primary bg-primary/5' : 'border-border hover:border-slate-300'
                    }`}
                  >
                    <input type="radio" name="dispatch" value={opt.mode} checked={dispatchMode === opt.mode}
                      onChange={() => setDispatchMode(opt.mode)} className="mt-0.5" />
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dispatchMode === opt.mode ? 'bg-primary/10' : 'bg-surfaceHighlight border border-border'}`}>
                        <Icon className={`w-4 h-4 ${dispatchMode === opt.mode ? 'text-primary' : 'text-text-muted'}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{opt.label}</div>
                        <div className="text-xs text-text-muted">{opt.desc}</div>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>

            {/* Date/time picker for schedule */}
            {dispatchMode === 'schedule' && (
              <div className="flex gap-3 pt-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={e => setScheduledAt(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                {scheduledAt && (
                  <div className="self-end px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700">
                    {format(new Date(scheduledAt), 'MMM d, yyyy · h:mm a')}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 font-medium">{error}</div>
          )}
        </div>
      )}

      {/* ── Navigation buttons ── */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => step === 0 ? navigate('/campaigns') : setStep(s => s - 1)}
          className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-surfaceHighlight transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSubmit('draft')}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-surfaceHighlight disabled:opacity-40 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />} Save Draft
            </button>
            <button
              onClick={() => handleSubmit(dispatchMode === 'schedule' ? 'schedule' : 'now')}
              disabled={saving || (dispatchMode === 'schedule' && !scheduledAt)}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : dispatchMode === 'schedule' ? <Calendar className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {dispatchMode === 'schedule' ? 'Schedule' : dispatchMode === 'now' ? 'Dispatch Now' : 'Save Draft'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
