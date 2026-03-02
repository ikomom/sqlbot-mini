import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { QueryResponse } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartDisplayProps {
  result: QueryResponse
}

type ChartType = 'bar' | 'table'

interface ChartData {
  name: string
  value: number
}

export default function ChartDisplay({ result }: ChartDisplayProps) {
  if (!result) return null

  const { sql, columns, data, row_count } = result

  // 根据数据结构判断图表类型
  const getChartType = (): ChartType => {
    if (data.length === 0) return 'table'
    if (columns.length === 2) {
      // 两列数据：适合柱状图/折线图
      return 'bar'
    }
    return 'table'
  }

  const chartType = getChartType()

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="py-10 text-center text-gray-400">
          没有数据
        </div>
      )
    }

    if (chartType === 'bar' && columns.length === 2) {
      const chartData: ChartData[] = data.map(row => ({
        name: String(row[columns[0]]),
        value: Number(row[columns[1]]) || 0
      }))

      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    // 默认：表格视图
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>查询结果</CardTitle>
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
