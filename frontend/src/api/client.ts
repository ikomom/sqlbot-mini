import axios, { AxiosError } from 'axios'
import type { ApiError } from '@/types'

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<ApiError>) => {
    const message = error.response?.data?.detail || error.message || '请求失败'
    throw new Error(message)
  }
)

export default apiClient
