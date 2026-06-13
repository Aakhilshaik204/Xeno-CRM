import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'
import { Users, Plus, Search, ChevronRight, Brain, SlidersHorizontal, TrendingUp, Calendar, Sparkles, Trash2 } from 'lucide-react'
import Skeleton from '../components/Skeleton'

const TIER_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-green-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-violet-600',
]

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function SegmentCard({ segment, index, onClick, onDelete }: { segment: any; index: number; onClick: () => void; onDelete: (e: React.MouseEvent) => void }) {
  const gradient = TIER_GRADIENTS[index % TIER_GRADIENTS.length]
  const rules: any[] = segment.filterConfig || []

  return (
    <div
      onClick={onClick}
      className="bg-surface rounded-2xl border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group overflow-hidden relative"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Card top stripe */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

      {/* Delete Button */}
      <button
        onClick={onDelete}
        title="Delete segment"
        className="absolute top-4 right-4 p-2 rounded-lg text-text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors z-10 opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pr-8">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`}>
              {getInitials(segment.name)}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors truncate max-w-[160px]">
                {segment.name}
              </h3>
              {segment.createdBy === 'ai' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full mt-1">
                  <Sparkles className="w-2.5 h-2.5" /> AI Generated
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {segment.description && (
          <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{segment.description}</p>
        )}

        {/* Filter Rule Pills */}
        {rules.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {rules.slice(0, 3).map((r: any, i: number) => (
              <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surfaceHighlight border border-border text-text-muted">
                {r.field === 'id' ? (r.operator === 'notIn' ? 'Excluded specific customers' : 'Specific customers selected') : `${r.field} ${r.operator} ${r.value}`}
              </span>
            ))}
            {rules.length > 3 && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surfaceHighlight border border-border text-text-muted">
                +{rules.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-sm font-bold">{segment.customerCount.toLocaleString()}</span>
            <span className="text-xs text-text-muted">customers</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Calendar className="w-3 h-3" />
            {format(new Date(segment.createdAt), 'MMM d, yyyy')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Audiences() {
  const navigate = useNavigate()
  const [segments, setSegments] = useState<any[]>([])
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAudiences = () => {
    axios.get('/api/audiences')
      .then(res => {
        setSegments(res.data.segments)
        setTotalCustomers(res.data.totalCustomers)
      })
      .catch(e => console.error('Failed to load audiences', e))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAudiences()
  }, [])

  const executeDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await axios.delete(`/api/audiences/${deleteId}`)
      setDeleteId(null)
      fetchAudiences()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete segment')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = segments.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Audiences</h2>
          <p className="text-text-muted mt-1 text-sm">Manage and explore your customer segments</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/agent"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 bg-violet-50 border border-violet-200 px-4 py-2.5 rounded-xl hover:bg-violet-100 transition-colors"
          >
            <Brain className="w-4 h-4" /> Build with AI
          </Link>
          <Link to="/audiences/new" className="inline-flex items-center gap-2 btn-primary text-sm">
            <Plus className="w-4 h-4" /> Create Segment
          </Link>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Segments', value: segments.length, icon: SlidersHorizontal, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Total Customers', value: totalCustomers.toLocaleString(), icon: Users, color: 'text-sky-600', bg: 'bg-sky-50' },
            { label: 'AI-Generated', value: segments.filter(s => s.createdBy === 'ai').length, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-surface rounded-2xl border border-border p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-extrabold">{stat.value}</div>
                  <div className="text-xs text-text-muted font-medium">{stat.label}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Search & View Toggle ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search segments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
          />
        </div>
        <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={`px-3.5 py-2.5 text-sm font-medium transition-colors ${view === 'grid' ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3.5 py-2.5 text-sm font-medium transition-colors ${view === 'list' ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}
          >
            List
          </button>
        </div>
        {search && (
          <span className="text-xs text-text-muted">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-surface rounded-2xl border border-border p-6 space-y-4">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s, i) => (
            <SegmentCard key={s.id} segment={s} index={i} onClick={() => navigate(`/audiences/${s.id}`)} onDelete={(e) => { e.stopPropagation(); setDeleteId(s.id); }} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-20 text-center text-text-muted">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No segments found</p>
              <p className="text-sm mt-1">Try a different search term or create a new segment</p>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-surfaceHighlight border-b border-border text-xs uppercase tracking-wider text-text-muted">
                <th className="px-6 py-4 font-semibold">Segment</th>
                <th className="px-6 py-4 font-semibold">Filters</th>
                <th className="px-6 py-4 font-semibold text-center">Size</th>
                <th className="px-6 py-4 font-semibold text-right">Created</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s, i) => {
                const gradient = TIER_GRADIENTS[i % TIER_GRADIENTS.length]
                return (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/audiences/${s.id}`)}
                    className="hover:bg-surfaceHighlight/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                          {getInitials(s.name)}
                        </div>
                        <div>
                          <div className="font-semibold group-hover:text-primary transition-colors">{s.name}</div>
                          {s.description && <div className="text-xs text-text-muted mt-0.5 truncate max-w-[200px]">{s.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(s.filterConfig || []).slice(0, 2).map((r: any, j: number) => (
                          <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-surfaceHighlight border border-border text-text-muted font-medium">
                            {r.field === 'id' ? (r.operator === 'notIn' ? 'Excluded specific customers' : 'Specific customers selected') : `${r.field} ${r.operator} ${r.value}`}
                          </span>
                        ))}
                        {(s.filterConfig || []).length > 2 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surfaceHighlight border border-border text-text-muted font-medium">
                            +{s.filterConfig.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        <Users className="w-3 h-3" /> {s.customerCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-text-muted">
                      {format(new Date(s.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteId(s.id); }}
                          className="p-1.5 rounded-lg text-text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete segment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    No segments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
              <h3 className="font-bold text-lg text-center mb-1">Delete Segment?</h3>
              <p className="text-sm text-text-muted text-center mb-6">This will permanently delete the audience segment. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-semibold hover:bg-surfaceHighlight transition-colors">Cancel</button>
                <button onClick={executeDelete} disabled={deleting}
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
