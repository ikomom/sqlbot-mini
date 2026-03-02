import { useState } from 'react'
import DatabaseConfig from './components/DatabaseConfig'
import QueryInput from './components/QueryInput'
import ChartDisplay from './components/ChartDisplay'
import type { QueryResponse } from '@/types'

function App() {
  const [connected, setConnected] = useState<boolean>(false)
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-8 px-5 text-center shadow-md">
        <h1 className="text-3xl font-bold mb-2">SQL Bot Mini</h1>
        <p className="text-indigo-100">自然语言转SQL查询工具</p>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-5">
        <DatabaseConfig onConnect={setConnected} />

        {connected && (
          <>
            <QueryInput onQueryResult={setQueryResult} />
            {queryResult && <ChartDisplay result={queryResult} />}
          </>
        )}

        {!connected && (
          <div className="bg-white p-10 rounded-lg text-center text-gray-600">
            请先配置并连接数据库
          </div>
        )}
      </main>
    </div>
  )
}

export default App
