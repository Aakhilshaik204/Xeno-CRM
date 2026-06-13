import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { BarChart3 } from 'lucide-react'

interface ChartSeries {
  key: string
  name: string
  color: string
}

interface ChartData {
  title: string
  chartType: 'bar' | 'line' | 'area' | 'pie'
  xAxisKey: string
  series: ChartSeries[]
  data: any[]
}

export function ChartPanel({ data }: { data: ChartData }) {
  const { title, chartType, xAxisKey, series, data: chartData } = data

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xAxisKey} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {series.map((s, idx) => (
                <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color || `hsl(${idx * 40}, 70%, 50%)`} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xAxisKey} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {series.map((s, idx) => (
                <Line type="monotone" key={s.key} dataKey={s.key} name={s.name} stroke={s.color || `hsl(${idx * 40}, 70%, 50%)`} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xAxisKey} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {series.map((s, idx) => (
                <Area type="monotone" key={s.key} dataKey={s.key} name={s.name} stroke={s.color || `hsl(${idx * 40}, 70%, 50%)`} fill={s.color || `hsl(${idx * 40}, 70%, 50%)`} fillOpacity={0.3} strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )
      case 'pie':
        const valueKey = series[0]?.key
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Pie
                data={chartData}
                dataKey={valueKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
              >
                {chartData.map((entry, index) => {
                  const color = entry.color || series[index % series.length]?.color || `hsl(${index * 40}, 70%, 50%)`
                  return <Cell key={`cell-${index}`} fill={color} />
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )
      default:
        return <div className="p-8 text-center text-text-muted">Unsupported chart type: {chartType}</div>
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className="text-sm text-text-muted capitalize">{chartType} Chart Visualization</span>
          </div>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        {renderChart()}
      </div>
    </div>
  )
}
