import apiClient from './client'
import type { QueryRequest, QueryResponse } from '@/types'

export const queryApi = {
  /**
   * 执行自然语言查询
   */
  executeNaturalQuery: (request: QueryRequest): Promise<QueryResponse> => 
    apiClient.post('/query', request),
  
  /**
   * 执行原始 SQL 查询
   */
  executeSql: (sql: string): Promise<QueryResponse> => 
    apiClient.post('/query/sql', { sql }),
}
