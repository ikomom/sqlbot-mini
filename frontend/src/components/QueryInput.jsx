import { useState } from 'react'

export default function QueryInput({ onQueryResult }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:8001/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ natural_query: query })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || '查询失败')
      }

      const result = await response.json()
      onQueryResult(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h2>自然语言查询</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入你的查询，例如：显示所有用户的数量"
          style={styles.textarea}
          rows={4}
        />
        {error && <div style={styles.error}>{error}</div>}
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? '查询中...' : '执行查询'}
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
  textarea: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  button: {
    padding: '10px 20px',
    background: '#28a745',
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
