import apiClient from './client'
import type { DatabaseConfig, DatabaseStatus, DatabaseSchema, ConnectResponse } from '@/types'

export const databaseApi = {
  /**
   * 连接数据库
   */
  connect: (config: DatabaseConfig): Promise<ConnectResponse> => 
    apiClient.post('/database/connect', config),
  
  /**
   * 使用默认配置连接数据库
   */
  connectDefault: (): Promise<ConnectResponse> => 
    apiClient.post('/database/connect/default'),
  
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
