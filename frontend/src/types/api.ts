// API 错误
export interface ApiError {
  detail: string
}

// API 响应包装
export interface ApiResponse<T> {
  data?: T
  error?: ApiError
}

// 连接响应
export interface ConnectResponse {
  status: string
  message: string
}

// 查询提示词
export interface QuerySuggestion {
  query: string
  category: string
  chart_type: 'table' | 'bar' | 'pie' | 'line'
  icon: string
}
