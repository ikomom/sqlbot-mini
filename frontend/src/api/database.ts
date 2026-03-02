import apiClient from './client'
import type { DatabaseConfig, DatabaseStatus, DatabaseSchema, ConnectResponse } from '@/types'

export const databaseApi = {
  /**
   * 连接数据库
   */
  connect: (config: DatabaseConfig): Promise<ConnectResponse> => 
    apiClient.post('/database/connect', config),
  
  /**
   * 检查数据库连接状态
   */
  getStatus: (): Promise<DatabaseStatus> => 
    apiClient.get('/database/status'),
  
  /**
   * 获取数据库结构信息
   */
  getSchema: (): Promise<DatabaseSchema> => 
    apiClient.get('/database/schema'),
}
