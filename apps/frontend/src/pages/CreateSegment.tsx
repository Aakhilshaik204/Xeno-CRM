import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Plus, Trash2, Users, Save, Sparkles, AlertCircle, CheckSquare, Square } from 'lucide-react'

type Operator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith'
type Field = 'totalSpend' | 'orderCount' | 'daysSinceLastOrder' | 'city' | 'gender'

interface FilterRule {
  field: Field | 'id'
  operator: Operator | 'notIn'
  value: any
}

const FIELD_OPTIONS: { value: Field; label: string; type: 'number' | 'text' }[] = [
  { value: 'totalSpend', label: 'Total Spend (₹)', type: 'number' },
  { value: 'orderCount', label: 'Total Orders', type: 'number' },
  { value: 'daysSinceLastOrder', label: 'Days Since Last Order', type: 'number' },
  { value: 'city', label: 'City', type: 'text' },
  { value: 'gender', label: 'Gender', type: 'text' },
]

const OPERATOR_OPTIONS: Record<'number' | 'text', { value: Operator; label: string }[]> = {
  number: [
    { value: 'gt', label: 'Greater Than' },
    { value: 'gte', label: 'Greater or Equal' },
    { value: 'lt', label: 'Less Than' },
    { value: 'lte', label: 'Less or Equal' },
    { value: 'eq', label: 'Equals' },
  ],
  text: [
    { value: 'eq', label: 'Exact Match' },
    { value: 'neq', label: 'Does Not Match' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts With' },
  ]
}

export default function CreateSegment() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rules, setRules] = useState<FilterRule[]>([
    { field: 'totalSpend', operator: 'gte', value: 0 }
  ])
  
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [previewCustomers, setPreviewCustomers] = useState<any[]>([])
  const [excludedCustomerIds, setExcludedCustomerIds] = useState<Set<string>>(new Set())
  
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleAddRule = () => {
    setRules([...rules, { field: 'totalSpend', operator: 'gte', value: 0 }])
  }

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
  }

  const handleRuleChange = (index: number, key: keyof FilterRule, val: any) => {
    const newRules = [...rules]
    if (key === 'field') {
      const fieldDef = FIELD_OPTIONS.find(f => f.value === val)
      newRules[index] = {
        field: val as Field,
        operator: fieldDef?.type === 'number' ? 'gte' : 'eq',
        value: fieldDef?.type === 'number' ? 0 : ''
      }
    } else {
      newRules[index] = { ...newRules[index], [key]: val }
    }
    setRules(newRules)
    setPreviewCount(null) 
    setPreviewCustomers([])
    setExcludedCustomerIds(new Set())
  }

  const handlePreview = async () => {
    setLoadingPreview(true)
    setError('')
    setExcludedCustomerIds(new Set())
    try {
      const res = await axios.post('/api/audiences/preview', { filterConfig: rules })
      setPreviewCount(res.data.count)
      setPreviewCustomers(res.data.customers || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate preview')
    } finally {
      setLoadingPreview(false)
    }
  }

  const toggleExclusion = (id: string) => {
    const newSet = new Set(excludedCustomerIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExcludedCustomerIds(newSet)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Segment name is required')
      return
    }
    if (rules.length === 0) {
      setError('At least one rule is required')
      return
    }

    setSaving(true)
    setError('')
    
    // If user excluded customers, dynamically append a 'notIn' rule
    const finalRules = [...rules]
    if (excludedCustomerIds.size > 0) {
      finalRules.push({
        field: 'id',
        operator: 'notIn',
        value: Array.from(excludedCustomerIds)
      })
    }

    try {
      await axios.post('/api/audiences', {
        name,
        description,
        filterConfig: finalRules
      })
      navigate('/audiences')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save segment')
      setSaving(false)
    }
  }

  // Actual display count subtracts manually excluded items
  const displayCount = previewCount !== null ? previewCount - excludedCustomerIds.size : null

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/audiences')} className="p-2 bg-surface border border-border rounded-xl hover:bg-background transition-colors text-text-muted hover:text-text">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Create Segment</h2>
          <p className="text-text-muted mt-1 text-sm">Define dynamic rules to group your customers</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border border-red-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Rules Builder */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface border border-border p-6 rounded-2xl space-y-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Segment Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. VIP Customers, Diwali Shoppers"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What is this segment used for?"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Filter Rules</h3>
                <button
                  onClick={handleAddRule}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Rule
                </button>
              </div>

              <div className="space-y-3">
                {rules.map((rule, idx) => {
                  const fieldDef = FIELD_OPTIONS.find(f => f.value === rule.field)
                  const opOptions = fieldDef ? OPERATOR_OPTIONS[fieldDef.type] : []

                  return (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-background border border-border rounded-xl">
                      <select
                        value={rule.field}
                        onChange={e => handleRuleChange(idx, 'field', e.target.value)}
                        className="w-full sm:w-1/3 px-3 py-2 bg-surface border border-border rounded-lg text-sm outline-none"
                      >
                        {FIELD_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>

                      <select
                        value={rule.operator}
                        onChange={e => handleRuleChange(idx, 'operator', e.target.value)}
                        className="w-full sm:w-1/3 px-3 py-2 bg-surface border border-border rounded-lg text-sm outline-none"
                      >
                        {opOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>

                      <input
                        type={fieldDef?.type === 'number' ? 'number' : 'text'}
                        value={rule.value}
                        onChange={e => handleRuleChange(idx, 'value', e.target.value)}
                        placeholder="Value"
                        className="w-full sm:w-1/3 px-3 py-2 bg-surface border border-border rounded-lg text-sm outline-none"
                      />

                      <button
                        onClick={() => handleRemoveRule(idx)}
                        className="p-2 text-text-muted hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
                {rules.length === 0 && (
                  <div className="text-center py-6 text-sm text-text-muted border border-dashed border-border rounded-xl">
                    No rules defined. This segment will include all customers.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Customer Preview List */}
          {previewCustomers.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border bg-background">
                <h3 className="font-bold">Matching Customers (Preview)</h3>
                <p className="text-xs text-text-muted mt-1">Uncheck anyone you want to manually exclude from this segment.</p>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                <div className="space-y-1">
                  {previewCustomers.map(customer => {
                    const isExcluded = excludedCustomerIds.has(customer.id)
                    return (
                      <div 
                        key={customer.id} 
                        onClick={() => toggleExclusion(customer.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isExcluded ? 'bg-background opacity-50' : 'hover:bg-background'}`}
                      >
                        <button className="text-primary shrink-0">
                          {isExcluded ? <Square className="w-5 h-5 text-text-muted" /> : <CheckSquare className="w-5 h-5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{customer.name}</div>
                          <div className="text-xs text-text-muted truncate">{customer.email || customer.phone}</div>
                        </div>
                        <div className="text-right shrink-0 text-xs text-text-muted font-medium">
                          ₹{customer.totalSpend?.toLocaleString() || 0}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {previewCount !== null && previewCount > 50 && (
                  <div className="text-center p-3 text-xs text-text-muted font-medium">
                    Showing top 50 of {previewCount.toLocaleString()} customers.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Preview & Actions */}
        <div className="space-y-4">
          <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm text-center">
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-1">Audience Size</h3>
            <p className="text-sm text-text-muted mb-6">See how many customers match</p>
            
            {displayCount !== null ? (
              <div className="text-4xl font-extrabold text-primary mb-6">
                {displayCount.toLocaleString()}
              </div>
            ) : (
              <div className="text-3xl font-extrabold text-text-muted mb-6">-</div>
            )}

            <button
              onClick={handlePreview}
              disabled={loadingPreview || rules.length === 0}
              className="w-full btn-secondary py-2.5 flex justify-center items-center gap-2"
            >
              {loadingPreview ? 'Calculating...' : 'Preview Size'}
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || displayCount === null}
            className="w-full btn-primary py-3 flex justify-center items-center gap-2 font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 disabled:shadow-none"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Segment'}
          </button>

          <div className="bg-violet-50 border border-violet-100 p-4 rounded-xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
            <p className="text-xs text-violet-800 leading-relaxed font-medium">
              Want an easier way? You can ask XenoAI to build complex segments for you just by describing them!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
