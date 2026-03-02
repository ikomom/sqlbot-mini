import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function ChartDisplay({ result }) {
  if (!result) return null

  const { sql, columns, data, row_count } = result

  // Determine chart type based on data structure
  const getChartType = () => {
    if (data.length === 0) return 'table'
    if (columns.length === 2) {
      // Two columns: likely x-y data for bar/line chart
      return 'bar'
    }
    return 'table'
  }

  const chartType = getChartType()

  const renderChart = () => {
    if (data.length === 0) {
      return <div style={styles.noData}>没有数据</div>
    }

    if (chartType === 'bar' && columns.length === 2) {
      const chartData = data.map(row => ({
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

    // Default: table view
    return (
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} style={styles.th}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {columns.map((col, j) => (
                  <td key={j} style={styles.td}>{String(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h2>查询结果</h2>
      
      <div style={styles.sqlBox}>
        <strong>生成的SQL:</strong>
        <pre style={styles.sql}>{sql}</pre>
      </div>

      <div style={styles.stats}>
        返回 {row_count} 行数据
      </div>

      {renderChart()}
    </div>
  )
}

const styles = {
  container: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  sqlBox: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '4px',
    marginTop: '15px',
    marginBottom: '15px'
  },
  sql: {
    margin: '10px 0 0 0',
    padding: '10px',
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px',
    overflow: 'auto'
  },
  stats: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px'
  },
  tableContainer: {
    overflow: 'auto',
    maxHeight: '400px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  th: {
    background: '#f8f9fa',
    padding: '10px',
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6',
    fontWeight: '600'
  },
  td: {
    padding: '10px',
    borderBottom: '1px solid #dee2e6'
  },
  noData: {
    padding: '40px',
    textAlign: 'center',
    color: '#999'
  }
}
