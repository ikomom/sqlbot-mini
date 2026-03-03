// 查询日志条目类型
export interface QueryLogEntry {
  id: string
  timestamp: Date
  naturalQuery: string
  aiProvider: string
  status: 'success' | 'failed'
  sql: string
  rowCount?: number
  retries?: Array<{
    attempt: number
    sql: string
    error: string
    aiRequest: {
      prompt: string
      schema_context: string
    }
    aiResponse: {
      raw_content: string
      model: string
      usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
      }
    }
  }>
  finalError?: string
  aiRequest?: {
    prompt: string
    schema_context: string
  }
  aiResponse?: {
    raw_content: string
    model: string
    usage: object
  }
}

// Zustand Store 类型
export interface LogStore {
  logs: QueryLogEntry[]
  filters: {
    status: 'all' | 'success' | 'failed'
    aiProvider: 'all' | 'openai' | 'anthropic' | 'deepseek'
    keyword: string
  }
  addLog: (log: QueryLogEntry) => void
  clearLogs: () => void
  setFilter: (key: string, value: string) => void
  getFilteredLogs: () => QueryLogEntry[]
}
