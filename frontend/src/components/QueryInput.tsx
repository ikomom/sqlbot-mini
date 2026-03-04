import { useState, useEffect } from 'react'
import { queryApi, databaseApi } from '@/api'
import type { QueryResponse, AIProvider, QuerySuggestion, QueryLogEntry, TableSchema } from '@/types'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Sparkles, Zap, AlertTriangle, ChevronRight } from 'lucide-react'
import { useLogStore } from '@/stores/logStore'
import { v4 as uuidv4 } from 'uuid'
import MentionTextarea from '@/components/mention/MentionTextarea'
import { parseSchemaText } from '@/utils/schemaParser'

interface QueryInputProps {
  onQueryResult: (result: QueryResponse) => void
}

interface ErrorDetail {
  message: string
  attempts: number
  sqls: string[]
  errors: string[]
}

export default function QueryInput({ onQueryResult }: QueryInputProps) {
  const [query, setQuery] = useState<string>('')
  const [aiProvider, setAiProvider] = useState<AIProvider>('deepseek')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetail, setErrorDetail] = useState<ErrorDetail | null>(null)
  const [suggestions, setSuggestions] = useState<QuerySuggestion[]>([])
  const [tables, setTables] = useState<TableSchema[]>([])
  
  const addLog = useLogStore((state) => state.addLog)

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const result = await databaseApi.getSuggestions()
        setSuggestions(result.suggestions)
      } catch (err) {
        console.error('获取提示词失败:', err)
      }
    }

    fetchSuggestions()
  }, [])

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const result = await databaseApi.getSchema()
        setTables(parseSchemaText(result.schema))
      } catch (err) {
        console.error('获取 Schema 失败:', err)
        setTables([])
      }
    }

    fetchSchema()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setErrorDetail(null)

    try {
      const result = await queryApi.executeNaturalQuery({
        natural_query: query,
        ai_provider: aiProvider
      })
      
      const logEntry: QueryLogEntry = {
        id: uuidv4(),
        timestamp: new Date(),
        naturalQuery: query,
        aiProvider: aiProvider,
        status: 'success',
        sql: result.sql,
        rowCount: result.row_count,
        aiRequest: result.log_info.attempts[0]?.ai_request,
        aiResponse: result.log_info.attempts[0]?.ai_response,
        retries: result.log_info.attempts.length > 1 
          ? result.log_info.attempts.slice(1).map(att => ({
              attempt: att.attempt,
              sql: att.sql,
              error: att.error || '',
              aiRequest: att.ai_request,
              aiResponse: att.ai_response
            }))
          : undefined
      }
      addLog(logEntry)
      
      onQueryResult(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '查询失败'
      
      try {
        const detail: ErrorDetail = JSON.parse(errorMessage)
        if (detail.attempts && detail.sqls && detail.errors) {
          setErrorDetail(detail)
          setError(detail.message)
        } else {
          setError(errorMessage)
        }
      } catch {
        setError(errorMessage)
      }
      
      try {
        const errorData = JSON.parse(errorMessage)
        if (errorData.log_info) {
          const logEntry: QueryLogEntry = {
            id: uuidv4(),
            timestamp: new Date(),
            naturalQuery: query,
            aiProvider: aiProvider,
            status: 'failed',
            sql: errorData.log_info.attempts[0]?.sql || '',
            finalError: errorData.message,
            aiRequest: errorData.log_info.attempts[0]?.ai_request,
            aiResponse: errorData.log_info.attempts[0]?.ai_response,
            retries: errorData.log_info.attempts.slice(1).map((att: any) => ({
              attempt: att.attempt,
              sql: att.sql,
              error: att.error || '',
              aiRequest: att.ai_request,
              aiResponse: att.ai_response
            }))
          }
          addLog(logEntry)
        }
      } catch {
        const logEntry: QueryLogEntry = {
          id: uuidv4(),
          timestamp: new Date(),
          naturalQuery: query,
          aiProvider: aiProvider,
          status: 'failed',
          sql: '',
          finalError: errorMessage
        }
        addLog(logEntry)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: QuerySuggestion) => {
    setQuery(suggestion.query)
  }

  return (
    <div className="relative">
      {/* 主卡片 */}
      <div className="relative overflow-hidden rounded-lg border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
        {/* 顶部装饰线 */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        
        {/* 标题区域 */}
        <div className="px-6 py-4 border-b border-cyan-500/20">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-cyan-100 font-mono tracking-wide">
              自然语言查询
            </h2>
          </div>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* AI 模型选择 */}
          <div className="space-y-2">
            <Label htmlFor="ai-provider" className="text-sm font-mono text-cyan-300 tracking-wide">
              AI 模型
            </Label>
            <Select value={aiProvider} onValueChange={(value) => setAiProvider(value as AIProvider)}>
              <SelectTrigger 
                id="ai-provider"
                className="bg-slate-800/50 border-cyan-500/30 text-cyan-100 font-mono hover:border-cyan-500/50 focus:border-cyan-400 transition-colors"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-cyan-500/30">
                <SelectItem value="openai" className="font-mono text-cyan-100 focus:bg-cyan-500/20">OpenAI</SelectItem>
                <SelectItem value="anthropic" className="font-mono text-cyan-100 focus:bg-cyan-500/20">Anthropic</SelectItem>
                <SelectItem value="deepseek" className="font-mono text-cyan-100 focus:bg-cyan-500/20">DeepSeek</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 查询输入 */}
          <div className="space-y-2">
            <Label htmlFor="query-input" className="text-sm font-mono text-cyan-300 tracking-wide">
              查询输入
            </Label>
            <MentionTextarea
              id="query-input"
              value={query}
              onChange={setQuery}
              placeholder="输入你的查询，例如：统计用户表中各状态的数量分布"
              rows={4}
              className="resize-y bg-slate-800/50 border-cyan-500/30 text-cyan-50 placeholder:text-slate-500 font-mono text-sm focus:border-cyan-400 focus:ring-cyan-400/20 transition-colors"
              tables={tables}
            />
          </div>

          {/* 快速示例 */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono tracking-wider">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>快速示例</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.category}-${index}`}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="group relative px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-300 rounded border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 font-mono"
                  >
                    <span className="mr-1.5">{suggestion.icon}</span>
                    <span>{suggestion.query}</span>
                    <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/5 rounded transition-colors duration-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 错误显示 */}
          {error && (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded border border-red-500/30 bg-gradient-to-br from-red-950/40 to-red-900/20 p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-300 font-mono">{error}</p>
                  </div>
                </div>
              </div>
              
              {errorDetail && (
                <div className="space-y-3 rounded border border-red-500/20 bg-red-950/20 p-4">
                  <div className="text-sm font-mono text-red-400 tracking-wide">
                    重试详情（共 {errorDetail.attempts} 次）
                  </div>
                  
                  {errorDetail.sqls.map((sql, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-semibold text-red-400 bg-red-500/20 px-2 py-1 rounded border border-red-500/30">
                          第 {index + 1} 次
                        </span>
                      </div>
                      
                      <div className="rounded border border-red-500/20 bg-slate-900/50 p-3 space-y-2">
                        <div>
                          <div className="text-xs font-mono text-slate-400 mb-1">SQL:</div>
                          <code className="text-xs text-red-300 block bg-slate-950/50 p-2 rounded overflow-x-auto font-mono border border-red-500/10">
                            {sql}
                          </code>
                        </div>
                        
                        {errorDetail.errors[index] && (
                          <div>
                            <div className="text-xs font-mono text-slate-400 mb-1">错误:</div>
                            <div className="text-xs text-red-400 bg-red-950/30 p-2 rounded font-mono border border-red-500/20">
                              {errorDetail.errors[index]}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 提交按钮 */}
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full relative group bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-slate-900 font-mono font-semibold tracking-wide py-6 text-base border-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-2">处理中</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <span>执行</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            )}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded transition-colors duration-300" />
          </Button>
        </form>

        {/* 底部装饰线 */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      </div>
    </div>
  )
}
