import { useState, useEffect } from 'react'
import axios from 'axios'
import Skeleton from '../components/Skeleton'
import { format } from 'date-fns'
import { Activity, Mail, MessageSquare } from 'lucide-react'

export default function Communications() {
  const [communications, setCommunications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchComms = async () => {
      try {
        const res = await axios.get('/api/communications')
        setCommunications(res.data.communications || [])
      } catch (err) {
        console.error('Failed to load communications', err)
      } finally {
        setLoading(false)
      }
    }
    fetchComms()
    
    // Poll for real-time updates every 3 seconds
    const interval = setInterval(fetchComms, 3000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'queued': return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      case 'sent': return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      case 'delivered': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20'
      case 'opened':
      case 'read':
      case 'clicked': return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
      case 'converted': return 'text-success bg-success/10 border-success/20'
      case 'failed': return 'text-danger bg-danger/10 border-danger/20'
      default: return 'text-text-muted bg-surfaceHighlight border-border'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Global Communications Feed
          </h2>
          <p className="text-text-muted mt-1">Real-time log of all outbound messages across all campaigns.</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-surface/50 text-sm font-medium text-text-muted">
                <th className="p-4 pl-6">Timestamp</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Campaign</th>
                <th className="p-4">Channel</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && communications.length === 0 ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4 pl-6"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                  </tr>
                ))
              ) : communications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted">
                    No communications found. Dispatch a campaign first!
                  </td>
                </tr>
              ) : (
                communications.map(comm => (
                  <tr key={comm.id} className="hover:bg-surfaceHighlight/30 transition-colors">
                    <td className="p-4 pl-6 text-sm text-text-muted whitespace-nowrap">
                      {format(new Date(comm.queuedAt), 'MMM d, HH:mm:ss')}
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium">{comm.customer?.name || 'Unknown'}</div>
                      <div className="text-xs text-text-muted">{comm.customer?.email}</div>
                    </td>
                    <td className="p-4 text-sm font-medium">
                      {comm.campaign?.name || 'Unknown Campaign'}
                    </td>
                    <td className="p-4">
                      {comm.channel === 'email' ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-1 rounded w-max">
                          <Mail className="w-3 h-3" /> EMAIL
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded w-max">
                          <MessageSquare className="w-3 h-3" /> SMS
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(comm.status)}`}>
                        {comm.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
