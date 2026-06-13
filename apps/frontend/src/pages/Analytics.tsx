import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  FunnelChart, Funnel, LabelList,
  AreaChart, Area,
  PieChart, Pie, Cell
} from 'recharts'
import { IndianRupee, MousePointerClick, ShoppingBag, TrendingUp, Trophy, Mail, MessageSquare, MessageCircle } from 'lucide-react'

type Tab = 'overview' | 'revenue' | 'channels' | 'campaigns'

export default function Analytics() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('/api/analytics')
        setData(res.data)
      } catch (e) {
        console.error('Failed to load analytics', e)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading || !data) return <div className="p-8 text-center text-text-muted animate-pulse">Loading analytics...</div>

  const { kpis, revenueOverTime, channelPerformance, topCampaigns, funnel, revenueByCampaign } = data

  const formatCurrency = (val: number) => `₹${val.toLocaleString()}`

  // Colors
  const funnelColors = ['#27272a', '#3b82f6', '#a855f7', '#22c55e']
  const funnelData = funnel.map((item: any, index: number) => ({ ...item, fill: funnelColors[index % funnelColors.length] }))
  
  const PIE_COLORS = { email: '#3b82f6', sms: '#a855f7', whatsapp: '#22c55e', rcs: '#f59e0b' }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Analytics</h2>
        <p className="text-text-muted mt-1">Campaign performance and revenue insights</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surfaceHighlight border border-border rounded-xl w-max">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'revenue', label: 'Revenue' },
          { id: 'channels', label: 'Channels' },
          { id: 'campaigns', label: 'Top Campaigns' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === tab.id ? 'bg-surface shadow-sm text-text' : 'text-text-muted hover:text-text hover:bg-surface/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5">
              <div className="flex items-center justify-between text-text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
                <IndianRupee className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold">{formatCurrency(kpis.totalRevenue)}</div>
            </div>
            <div className="glass-panel p-5">
              <div className="flex items-center justify-between text-text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold">{kpis.totalOrders.toLocaleString()}</div>
            </div>
            <div className="glass-panel p-5">
              <div className="flex items-center justify-between text-text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Avg Order Value</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold">{formatCurrency(Math.round(kpis.aov))}</div>
            </div>
            <div className="glass-panel p-5">
              <div className="flex items-center justify-between text-text-muted mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Global Conversion</span>
                <MousePointerClick className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-500">{kpis.globalConversionRate}%</div>
            </div>
          </div>

          {/* Funnel */}
          <div className="glass-panel p-6 flex flex-col h-[400px]">
            <h3 className="font-semibold mb-6 flex items-center gap-2">Aggregate Conversion Funnel</h3>
            <div className="flex-1 w-full min-h-0 relative flex items-center justify-center">
              {funnelData.every((d: any) => d.value === 0) ? (
                <div className="text-text-muted">Not enough data to construct funnel</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                      itemStyle={{ color: '#f4f4f5' }}
                    />
                    <Funnel dataKey="value" data={funnelData} isAnimationActive>
                      <LabelList position="right" fill="#a1a1aa" stroke="none" dataKey="name" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REVENUE TAB ── */}
      {activeTab === 'revenue' && (
        <div className="space-y-6 animate-fade-in">
          {/* Revenue Over Time */}
          <div className="glass-panel p-6 flex flex-col h-[400px]">
            <h3 className="font-semibold mb-6">Revenue Growth (Daily)</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueOverTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#27272a' }} />
                  <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#27272a' }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                    itemStyle={{ color: '#eab308' }}
                    formatter={(value: any) => [`₹${(value || 0).toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue By Campaign Bar Chart */}
          <div className="glass-panel p-6 flex flex-col h-[400px]">
            <h3 className="font-semibold mb-6">Revenue by Campaign</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByCampaign} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#27272a' }} />
                  <YAxis stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#27272a' }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    cursor={{ fill: '#27272a', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                    itemStyle={{ color: '#eab308' }}
                    formatter={(value: any) => [`₹${(value || 0).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#eab308" radius={[4, 4, 0, 0]} barSize={40} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── CHANNELS TAB ── */}
      {activeTab === 'channels' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 flex flex-col h-[400px]">
              <h3 className="font-semibold mb-6">Channel Distribution (Sent)</h3>
              <div className="flex-1 w-full min-h-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelPerformance}
                      dataKey="sent"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                    >
                      {channelPerformance.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={(PIE_COLORS as any)[entry.name] || '#a1a1aa'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                      formatter={(value: any) => [value.toLocaleString(), 'Sent']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel p-6 flex flex-col h-[400px]">
              <h3 className="font-semibold mb-6">Channel Revenue & Conversion</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelPerformance} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12, textTransform: 'capitalize' }} tickLine={false} axisLine={{ stroke: '#27272a' }} />
                    <YAxis yAxisId="left" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#27272a' }} tickFormatter={(val) => `₹${val}`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fill: '#10b981', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#27272a' }} tickFormatter={(val) => `${val}%`} />
                    <Tooltip 
                      cursor={{ fill: '#27272a', opacity: 0.4 }}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="conversionRate" name="Conv. Rate %" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CAMPAIGNS TAB ── */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-panel p-6">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Top Performing Campaigns
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="px-4 py-3 text-left font-semibold">Campaign Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Channel</th>
                    <th className="px-4 py-3 text-right font-semibold">Target Audience</th>
                    <th className="px-4 py-3 text-right font-semibold">Conversions</th>
                    <th className="px-4 py-3 text-right font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topCampaigns.map((c: any, idx: number) => {
                    const getIcon = (ch: string) => {
                      if (ch === 'email') return <Mail className="w-3 h-3 text-blue-500" />
                      if (ch === 'sms') return <MessageSquare className="w-3 h-3 text-purple-500" />
                      return <MessageCircle className="w-3 h-3 text-green-500" />
                    }
                    return (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-surfaceHighlight transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-text-muted">#{idx + 1}</span>
                            <span className="font-medium">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 capitalize text-xs font-semibold px-2.5 py-1 rounded-full bg-surfaceHighlight w-max border border-border">
                            {getIcon(c.channel)} {c.channel}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-text-muted">{c.target.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="font-medium">{c.converted.toLocaleString()}</div>
                          <div className="text-[10px] text-emerald-500">{c.target > 0 ? ((c.converted / c.target) * 100).toFixed(1) : 0}%</div>
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-amber-500">{formatCurrency(c.revenue)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
