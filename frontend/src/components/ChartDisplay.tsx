import { useState } from 'react'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import type { QueryResponse } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Table as TableIcon } from 'lucide-react'

interface ChartDisplayProps {
  result: QueryResponse
}

type ChartType = 'bar' | 'line' | 'pie' | 'table'

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a78bfa', '#fb923c', '#34d399', '#f472b6']

export default function ChartDisplay({ result }: ChartDisplayProps) {
  if (!result) return null

  const { sql, columns, data, row_count } = result

  // 智能判断默认图表类型
  const getDefaultChartType = (): ChartType => {
    if (data.length === 0) return 'table'
    
    // 如果只有两列数据
    if (columns.length === 2) {
      const firstCol = data[0][columns[0]]
      const secondCol = data[0][columns[1]]
      
      // 第二列是数字，第一列是文本/日期
      if (typeof secondCol === 'number' || !isNaN(Number(secondCol))) {
        // 如果第一列看起来像日期，用折线图
        if (String(firstCol).match(/\d{4}-\d{2}-\d{2}/) || String(firstCol).match(/\d{2}\/\d{2}/)) {
          return 'line'
        }
        // 如果数据少于8条，用饼图
        if (data.length <= 7) {
          return 'pie'
        }
        // 否则用柱状图
        return 'bar'
      }
    }
    
    return 'table'
  }

  const [chartType, setChartType] = useState<ChartType>(getDefaultChartType())

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="py-10 text-center text-gray-400">
          没有数据
        </div>
      )
    }

    // 准备图表数据
    const prepareChartData = (): ChartData[] => {
      if (columns.length === 2) {
        return data.map(row => ({
          name: String(row[columns[0]]),
          value: Number(row[columns[1]]) || 0
        }))
      }
      // 多列数据
      return data.map((row, index) => {
        const item: ChartData = { name: String(index + 1), value: 0 }
        columns.forEach(col => {
          item[col] = row[col]
        })
        return item
      })
    }

    const chartData = prepareChartData()

    // 柱状图
    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name={columns[1] || '数值'} />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    // 折线图
    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" name={columns[1] || '数值'} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    // 饼图
    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    // 表格视图
    return (
      <div className="overflow-auto max-h-96">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="bg-gray-50 px-3 py-2.5 text-left border-b-2 border-gray-200 font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {columns.map((col, j) => (
                  <td key={j} className="px-3 py-2.5 border-b border-gray-200">
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

  // 判断是否可以显示图表
  const canShowChart = data.length > 0 && columns.length >= 2

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>查询结果</CardTitle>
          
          {/* 图表类型切换按钮 */}
          {canShowChart && (
            <div className="flex gap-2">
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('bar')}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
              >
                <LineChartIcon className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('pie')}
              >
                <PieChartIcon className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('table')}
              >
                <TableIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <strong className="text-sm font-semibold">生成的SQL:</strong>
          <pre className="mt-2 p-3 bg-white border border-gray-200 rounded text-xs overflow-auto">
            {sql}
          </pre>
        </div>

        <div className="text-sm text-gray-600">
          返回 {row_count} 行数据
        </div>

        {renderChart()}
      </CardContent>
    </Card>
  )
}
