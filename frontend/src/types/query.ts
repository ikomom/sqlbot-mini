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
}
