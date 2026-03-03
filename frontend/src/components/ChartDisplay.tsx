import { useState } from 'react'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import type { QueryResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Table as TableIcon, Code2, Database } from 'lucide-react'

interface ChartDisplayProps {
  result: QueryResponse
}

type ChartType = 'bar' | 'line' | 'pie' | 'table'

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

const CYBER_COLORS = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff6b6b', '#4ecdc4', '#a78bfa', '#fb923c']

export default function ChartDisplay({ result }: ChartDisplayProps) {
  if (!result) return null

  const { sql, columns, data, row_count } = result

  const getDefaultChartType = (): ChartType => {
    if (data.length === 0) return 'table'
    
    if (columns.length === 2) {
      const firstCol = data[0][columns[0]]
      const secondCol = data[0][columns[1]]
      
      if (typeof secondCol === 'number' || !isNaN(Number(secondCol))) {
        if (String(firstCol).match(/\d{4}-\d{2}-\d{2}/) || String(firstCol).match(/\d{2}\/\d{2}/)) {
          return 'line'
        }
        if (data.length <= 7) {
          return 'pie'
        }
        return 'bar'
      }
    }
    
    return 'table'
  }

  const [chartType, setChartType] = useState<ChartType>(getDefaultChartType())

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="py-20 text-center">
          <Database className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
          <p className="text-slate-500 font-mono text-sm">暂无数据</p>
        </div>
      )
    }

    const prepareChartData = (): ChartData[] => {
      if (columns.length === 2) {
        return data.map(row => ({
          name: String(row[columns[0]]),
          value: Number(row[columns[1]]) || 0
        }))
      }
      return data.map((row, index) => {
        const item: ChartData = { name: String(index + 1), value: 0 }
        columns.forEach(col => {
          item[col] = row[col]
        })
        return item
      })
    }

    const chartData = prepareChartData()

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 255, 0.1)" />
            <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px', fontFamily: 'JetBrains Mono' }} />
            <YAxis stroke="#64748b" style={{ fontSize: '12px', fontFamily: 'JetBrains Mono' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '4px',
                fontFamily: 'JetBrains Mono',
                fontSize: '12px',
                color: '#00ffff'
              }} 
            />
            <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }} />
            <Bar dataKey="value" fill="#00ffff" name={columns[1] || '数值'} />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 255, 0.1)" />
            <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px', fontFamily: 'JetBrains Mono' }} />
            <YAxis stroke="#64748b" style={{ fontSize: '12px', fontFamily: 'JetBrains Mono' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '4px',
                fontFamily: 'JetBrains Mono',
                fontSize: '12px',
                color: '#00ffff'
              }} 
            />
            <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }} />
            <Line type="monotone" dataKey="value" stroke="#00ffff" name={columns[1] || '数值'} strokeWidth={2} dot={{ fill: '#00ffff', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'pie') {
      let pieData = chartData
      if (chartData.length > 8) {
        const topItems = chartData.slice(0, 7)
        const otherItems = chartData.slice(7)
        const otherSum = otherItems.reduce((sum, item) => sum + item.value, 0)
        pieData = [...topItems, { name: '其他', value: otherSum }]
      }

      return (
        <div className="flex flex-col lg:flex-row items-start justify-center gap-6 max-h-[400px]">
          <div className="w-full lg:w-1/2 flex-shrink-0">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={CYBER_COLORS[index % CYBER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    border: '1px solid rgba(0, 255, 255, 0.3)',
                    borderRadius: '4px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px',
                    color: '#00ffff'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="w-full lg:w-1/2 max-h-[300px] overflow-y-auto pr-2 flex-shrink-0">
            <div className="space-y-2">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-3 text-sm font-mono">
                  <div 
                    className="w-3 h-3 rounded-sm flex-shrink-0" 
                    style={{ 
                      backgroundColor: CYBER_COLORS[index % CYBER_COLORS.length],
                      boxShadow: `0 0 8px ${CYBER_COLORS[index % CYBER_COLORS.length]}40`
                    }}
                  />
                  <span className="text-cyan-100 break-words flex-1">
                    {entry.name}
                  </span>
                  <span className="text-cyan-400 ml-2 flex-shrink-0 font-semibold">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="overflow-auto max-h-96 rounded border border-cyan-500/20">
        <table className="w-full border-collapse text-sm font-mono">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="bg-slate-800/50 px-4 py-3 text-left border-b border-cyan-500/30 font-semibold text-cyan-300 tracking-wide">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-cyan-500/5 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className="px-4 py-3 border-b border-slate-700/50 text-cyan-50">
                    {String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const canShowChart = data.length > 0 && columns.length >= 2

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-lg border border-purple-500/30 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
        
        <div className="px-6 py-4 border-b border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-purple-100 font-mono tracking-wide">
                查询结果
              </h2>
            </div>
            
            {canShowChart && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChartType('bar')}
                  className={`border transition-all duration-300 ${
                    chartType === 'bar' 
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' 
                      : 'border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChartType('line')}
                  className={`border transition-all duration-300 ${
                    chartType === 'line' 
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' 
                      : 'border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300'
                  }`}
                >
                  <LineChartIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChartType('pie')}
                  className={`border transition-all duration-300 ${
                    chartType === 'pie' 
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' 
                      : 'border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300'
                  }`}
                >
                  <PieChartIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChartType('table')}
                  className={`border transition-all duration-300 ${
                    chartType === 'table' 
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' 
                      : 'border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300'
                  }`}
                >
                  <TableIcon className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="relative overflow-hidden rounded border border-cyan-500/20 bg-slate-950/50 p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono text-cyan-300 tracking-wider">生成的 SQL</span>
            </div>
            <pre className="text-xs font-mono text-cyan-100 overflow-auto p-3 bg-slate-900/50 rounded border border-cyan-500/10">
              {sql}
            </pre>
          </div>

          <div className="flex items-center space-x-2 text-sm font-mono">
            <span className="text-slate-400">行数:</span>
            <span className="text-cyan-400 font-semibold">{row_count}</span>
          </div>

          {renderChart()}
        </div>

        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      </div>
    </div>
  )
}
