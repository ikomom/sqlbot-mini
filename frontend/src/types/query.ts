// AI Provider 类型
export type AIProvider = 'openai' | 'anthropic' | 'deepseek'

// 查询请求
export interface QueryRequest {
  natural_query: string
  ai_provider?: AIProvider
}

// 查询响应
export interface QueryResponse {
  sql: string
  columns: string[]
  data: Record<string, any>[]
  row_count: number
  log_info: {
    ai_provider: string
    natural_query: string
    timestamp: string
    attempts: Array<{
      attempt: number
      sql: string
      success: boolean
      row_count?: number
      error?: string
      ai_request: {
        prompt: string
        schema_context: string
      }
      ai_response: {
        raw_content: string
        model: string
        usage: object
      }
    }>
    total_attempts: number
    final_status: 'success' | 'failed'
  }
}
