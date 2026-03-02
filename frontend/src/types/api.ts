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
