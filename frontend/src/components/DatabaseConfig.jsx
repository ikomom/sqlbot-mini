import { useState } from 'react'
import { databaseApi } from '../api'

export default function DatabaseConfig({ onConnect }) {
  const [config, setConfig] = useState({
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: 'postgres',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await databaseApi.connect(config)
      onConnect(true)
    } catch (err) {
      setError(err.message)
      onConnect(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h2>数据库配置</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label>数据库类型</label>
          <select
            value={config.type}
            onChange={(e) => setConfig({ ...config, type: e.target.value })}
            style={styles.input}
          >
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite</option>
          </select>
        </div>

        {config.type !== 'sqlite' && (
          <>
            <div style={styles.field}>
              <label>主机</label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label>端口</label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                style={styles.input}
              />
            </div>
          </>
        )}

        <div style={styles.field}>
          <label>数据库名</label>
          <input
            type="text"
            value={config.database}
            onChange={(e) => setConfig({ ...config, database: e.target.value })}
            style={styles.input}
            required
          />
        </div>

        {config.type !== 'sqlite' && (
          <>
            <div style={styles.field}>
              <label>用户名</label>
              <input
                type="text"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label>密码</label>
              <input
                type="password"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                style={styles.input}
              />
            </div>
          </>
        )}

        {error && <div style={styles.error}>{error}</div>}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? '连接中...' : '连接数据库'}
        </button>
      </form>
    </div>
  )
}

const styles = {
  container: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '15px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  button: {
    padding: '10px 20px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  error: {
    color: '#dc3545',
    fontSize: '14px'
  }
}
