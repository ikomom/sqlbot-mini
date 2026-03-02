import { useState, useEffect } from 'react'
import QueryInput from './components/QueryInput'
import ChartDisplay from './components/ChartDisplay'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import type { QueryResponse } from '@/types'

function App() {
  const [connected, setConnected] = useState<boolean>(false)
  const [connecting, setConnecting] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('正在连接数据库...')
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null)

  // 使用 SSE 连接到默认数据库
  useEffect(() => {
    const eventSource = new EventSource('/api/database/connect/stream')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        setStatusMessage(data.message)
        
        if (data.status === 'connected') {
          setConnected(true)
          setConnecting(false)
          setError(null)
          eventSource.close()
        } else if (data.status === 'error') {
          setConnected(false)
          setConnecting(false)
          setError(data.message)
          eventSource.close()
        }
      } catch (err) {
        console.error('解析 SSE 消息失败:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('SSE 连接错误:', err)
      setError('无法连接到服务器')
      setConnecting(false)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-8 px-5 text-center shadow-md">
        <h1 className="text-3xl font-bold mb-2">SQL Bot Mini</h1>
        <p className="text-indigo-100">自然语言转SQL查询工具</p>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-5">
        {connecting && (
          <div className="bg-white p-10 rounded-lg text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
            <p className="text-gray-600">{statusMessage}</p>
          </div>
        )}

        {!connecting && error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              {error}
              <br />
              <span className="text-sm mt-2 block">请检查后端 .env 文件中的数据库配置</span>
            </AlertDescription>
          </Alert>
        )}

        {!connecting && connected && (
          <>
            <QueryInput onQueryResult={setQueryResult} />
            {queryResult && <ChartDisplay result={queryResult} />}
          </>
        )}
      </main>
    </div>
  )
}

export default App
