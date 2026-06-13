import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  X, Save, Loader2, MessageSquare, Mail, Smartphone,
  Radio, Users, UserCheck, Search, Check, Calendar, MapPin
} from 'lucide-react'
import { format } from 'date-fns'

interface Segment { id: string; name: string; customerCount: number }
interface Customer {
  id: string; name: string; email: string; city: string
  membershipTier: string; totalSpend: number
}

const CHANNELS = [
  { id: 'sms',      label: 'SMS',       icon: Smartphone, color: 'text-violet-600',  active: 'bg-violet-600 text-white border-violet-600',  inactive: 'bg-violet-50 border-violet-200 text-violet-600' },
  { id: 'whatsapp', label: 'WhatsApp',  icon: MessageSquare, color: 'text-emerald-600', active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
  { id: 'email',    label: 'Email',     icon: Mail,      color: 'text-sky-600',     active: 'bg-sky-600 text-white border-sky-600',     inactive: 'bg-sky-50 border-sky-200 text-sky-600' },
  { id: 'rcs',      label: 'RCS',       icon: Radio,     color: 'text-amber-600',   active: 'bg-amber-600 text-white border-amber-600',   inactive: 'bg-amber-50 border-amber-200 text-amber-600' },
]

interface Props {
  campaign: any
  onClose: () => void
  onSaved: () => void
}

export default function EditCampaignDrawer({ campaign, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(campaign.name)
  const [channel, setChannel] = useState(campaign.channel)
  const [messageTemplate, setMessageTemplate] = useState(campaign.messageTemplate)
  const [audienceMode, setAudienceMode] = useState<'segment' | 'individual'>(
    campaign.segment?.createdBy === 'custom' ? 'individual' : 'segment'
  )
  const [selectedSegmentId, setSelectedSegmentId] = useState(
    campaign.segment?.createdBy === 'custom' ? '' : campaign.segmentId
  )
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([])
  const [scheduledAt, setScheduledAt] = useState(
    campaign.scheduledAt ? format(new Date(campaign.scheduledAt), "yyyy-MM-dd'T'HH:mm") : ''
  )

  const [segments, setSegments] = useState<Segment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [segmentSearch, setSegmentSearch] = useState('')
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  useEffect(() => {
    axios.get('/api/audiences').then(r => setSegments(r.data.segments || []))
  }, [])

  useEffect(() => {
    if (audienceMode === 'individual' && customers.length === 0) {
      setLoadingCustomers(true)
      axios.get('/api/customers').then(r => setCustomers(r.data.customers || [])).finally(() => setLoadingCustomers(false))
    }
  }, [audienceMode])

  const filteredCustomers = customers.filter(c =>
    !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const toggleCustomer = (id: string) =>
    setSelectedCustomerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const previewMessage = messageTemplate.replace(/\{\{name\}\}/g, 'Priya Sharma')

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const body: any = { name, channel, messageTemplate }
      if (audienceMode === 'segment') body.segmentId = selectedSegmentId
      else if (selectedCustomerIds.length > 0) body.customerIds = selectedCustomerIds
      if (scheduledAt) body.scheduledAt = new Date(scheduledAt).toISOString()
      else body.scheduledAt = null

      await axios.put(`/api/campaigns/${campaign.id}`, body)
      onSaved()
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white border-l border-border z-50 shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div>
            <h3 className="font-bold text-lg">Edit Campaign</h3>
            <p className="text-xs text-text-muted mt-0.5">Only draft & scheduled campaigns can be edited</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-surfaceHighlight transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Campaign Name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Channel */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Channel</label>
            <div className="grid grid-cols-4 gap-2">
              {CHANNELS.map(ch => {
                const Icon = ch.icon
                return (
                  <button key={ch.id} onClick={() => setChannel(ch.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all ${channel === ch.id ? ch.active : ch.inactive}`}
                  >
                    <Icon className="w-4 h-4" /> {ch.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Audience</label>
            <div className="flex rounded-xl border border-border overflow-hidden mb-3">
              <button onClick={() => setAudienceMode('segment')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${audienceMode === 'segment' ? 'bg-primary text-white' : 'text-text-muted hover:bg-surfaceHighlight'}`}>
                <Users className="w-3.5 h-3.5" /> Segment
              </button>
              <button onClick={() => setAudienceMode('individual')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${audienceMode === 'individual' ? 'bg-primary text-white' : 'text-text-muted hover:bg-surfaceHighlight'}`}>
                <UserCheck className="w-3.5 h-3.5" /> Individuals
              </button>
            </div>

            {audienceMode === 'segment' && (
              <div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                  <input type="text" value={segmentSearch} onChange={e => setSegmentSearch(e.target.value)}
                    placeholder="Search segments..." className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {segments.filter(s => s.name.toLowerCase().includes(segmentSearch.toLowerCase())).map(seg => (
                    <button key={seg.id} onClick={() => setSelectedSegmentId(seg.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left text-xs transition-all ${selectedSegmentId === seg.id ? 'bg-primary/5 border-primary text-primary' : 'border-border hover:bg-surfaceHighlight/40'}`}>
                      <span className="font-semibold">{seg.name}</span>
                      <span className="text-text-muted">{seg.customerCount.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {audienceMode === 'individual' && (
              <div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                  <input type="text" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                    placeholder="Search customers..." className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                {selectedCustomerIds.length > 0 && (
                  <div className="mb-2 text-xs font-medium text-primary">{selectedCustomerIds.length} customer{selectedCustomerIds.length !== 1 ? 's' : ''} selected</div>
                )}
                {loadingCustomers ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-text-muted text-xs"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</div>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {filteredCustomers.slice(0, 50).map(c => {
                      const checked = selectedCustomerIds.includes(c.id)
                      return (
                        <div key={c.id} onClick={() => toggleCustomer(c.id)}
                          className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors border-b border-border last:border-0 ${checked ? 'bg-primary/5' : 'hover:bg-surfaceHighlight/40'}`}>
                          <input type="checkbox" checked={checked} readOnly className="rounded pointer-events-none" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate">{c.name}</div>
                            <div className="text-[10px] text-text-muted">{c.membershipTier} · {c.city}</div>
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-600">₹{c.totalSpend.toLocaleString()}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Message Template</label>
            <textarea
              value={messageTemplate} onChange={e => setMessageTemplate(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-border rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
            <div className="mt-2 p-3 bg-surfaceHighlight/50 border border-border rounded-xl">
              <p className="text-[10px] text-text-muted mb-1 font-semibold uppercase tracking-wider">Preview</p>
              <p className="text-xs whitespace-pre-wrap">{previewMessage || <span className="italic text-text-muted">Start typing...</span>}</p>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Schedule (optional)</label>
            <input
              type="datetime-local" value={scheduledAt}
              min={new Date().toISOString().slice(0, 16)}
              onChange={e => setScheduledAt(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-xs text-text-muted mt-1.5">Leave empty to keep as draft. Set a date to auto-dispatch.</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-surfaceHighlight transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !name}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover disabled:opacity-40 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </>
  )
}
