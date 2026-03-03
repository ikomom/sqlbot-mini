import { useState, useEffect } from 'react'
import QueryInput from './components/QueryInput'
import ChartDisplay from './components/ChartDisplay'
import Header from './components/Header'
import QueryLogDialog from './components/QueryLogDialog'
import { Terminal, AlertTriangle } from 'lucide-react'
import type { QueryResponse } from '@/types'

function App() {
  const [connected, setConnected] = useState<boolean>(false)
  const [connecting, setConnecting] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('正在连接数据库...')
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null)
  const [logDialogOpen, setLogDialogOpen] = useState<boolean>(false)

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
    <div className="min-h-screen relative">
      {/* 背景渐变光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '6s', animationDelay: '1s' }} />
      </div>

      <div className="relative z-10">
        <Header 
          connected={connected}
          connecting={connecting}
          onOpenLog={() => setLogDialogOpen(true)}
        />

        <main className="max-w-7xl mx-auto py-12 px-6">
          {connecting && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
              <div className="relative">
                <Terminal className="w-16 h-16 text-cyan-400 animate-pulse" />
                <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-ping" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-mono text-cyan-400 text-glow-cyan">
                  {statusMessage}
                </p>
                <div className="flex items-center justify-center space-x-1">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {!connecting && error && (
            <div className="max-w-2xl mx-auto">
              <div className="relative overflow-hidden rounded-lg border border-red-500/30 bg-gradient-to-br from-red-950/40 to-red-900/20 backdrop-blur-sm p-8">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold text-red-400 font-mono">连接失败</h3>
                    <p className="text-red-300/80">{error}</p>
                    <p className="text-sm text-red-400/60 font-mono mt-4">
                      → 请检查后端 .env 文件中的数据库配置
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!connecting && connected && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <QueryInput onQueryResult={setQueryResult} />
              {queryResult && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ChartDisplay result={queryResult} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <QueryLogDialog 
        open={logDialogOpen}
        onOpenChange={setLogDialogOpen}
      />
    </div>
  )
}

export default App
