import { useState } from 'react'
import DatabaseConfig from './components/DatabaseConfig'
import QueryInput from './components/QueryInput'
import ChartDisplay from './components/ChartDisplay'

function App() {
  const [connected, setConnected] = useState(false)
  const [queryResult, setQueryResult] = useState(null)

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1>SQL Bot Mini</h1>
        <p>自然语言转SQL查询工具</p>
      </header>

      <main style={styles.main}>
        <DatabaseConfig onConnect={setConnected} />

        {connected && (
          <>
            <QueryInput onQueryResult={setQueryResult} />
            {queryResult && <ChartDisplay result={queryResult} />}
          </>
        )}

        {!connected && (
          <div style={styles.notice}>
            请先配置并连接数据库
          </div>
        )}
      </main>
    </div>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '30px 20px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px 20px'
  },
  notice: {
    background: 'white',
    padding: '40px',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#666',
    fontSize: '16px'
  }
}

export default App
