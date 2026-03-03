import { create } from 'zustand'
import type { QueryLogEntry, LogStore } from '@/types'

export const useLogStore = create<LogStore>((set, get) => ({
  logs: [],
  filters: {
    status: 'all',
    aiProvider: 'all',
    keyword: ''
  },
  
  addLog: (log: QueryLogEntry) => set((state) => {
    const newLogs = [log, ...state.logs].slice(0, 20) // 保留最新 20 条
    return { logs: newLogs }
  }),
  
  clearLogs: () => set({ 
    logs: [], 
    filters: { status: 'all', aiProvider: 'all', keyword: '' } 
  }),
  
  setFilter: (key: string, value: string) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),
  
  getFilteredLogs: () => {
    const { logs, filters } = get()
    
    return logs.filter(log => {
      // 状态筛选
      if (filters.status !== 'all' && log.status !== filters.status) {
        return false
      }
      
      // AI Provider 筛选
      if (filters.aiProvider !== 'all' && 
          log.aiProvider.toLowerCase() !== filters.aiProvider) {
        return false
      }
      
      // 关键词搜索
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase()
        const matchQuery = log.naturalQuery.toLowerCase().includes(keyword)
        const matchSql = log.sql.toLowerCase().includes(keyword)
        return matchQuery || matchSql
      }
      
      return true
    })
  }
}))
