import { useState, useEffect } from 'react'
import { queryApi, databaseApi } from '@/api'
import type { QueryResponse, AIProvider, QuerySuggestion, QueryLogEntry } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lightbulb, AlertCircle } from 'lucide-react'
import { useLogStore } from '@/stores/logStore'
import { v4 as uuidv4 } from 'uuid'

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
  
  // 获取日志记录函数
  const addLog = useLogStore((state) => state.addLog)

  // 获取查询提示词
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
      
      // 记录成功日志
      const logEntry: QueryLogEntry = {
        id: uuidv4(),
        timestamp: new Date(),
        naturalQuery: query,
        aiProvider: aiProvider,
        status: 'success',
        sql: result.sql,
        rowCount: result.row_count,
        // 解析 log_info 中的第一次尝试信息
        aiRequest: result.log_info.attempts[0]?.ai_request,
        aiResponse: result.log_info.attempts[0]?.ai_response,
        // 如果有重试（attempts > 1），记录重试信息
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
      
      // 尝试解析详细错误信息
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
      
      // 记录失败日志
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
        // 如果解析失败，创建简化的日志
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
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>自然语言查询</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-provider">AI 模型</Label>
            <Select value={aiProvider} onValueChange={(value) => setAiProvider(value as AIProvider)}>
              <SelectTrigger id="ai-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="query-input">查询内容</Label>
            <Textarea
              id="query-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入你的查询，例如：统计用户表中各状态的数量分布"
              rows={4}
              className="resize-y"
            />
          </div>

          {/* 查询提示词 - 紧凑布局，完整显示文字 */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>快速示例</span>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.category}-${index}`}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-2 py-1 text-xs bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 rounded transition-colors border border-gray-200 hover:border-indigo-300 flex items-center gap-1 whitespace-nowrap"
                    title={`${suggestion.category}: ${suggestion.query}`}
                  >
                    <span className="text-[10px]">{suggestion.icon}</span>
                    <span>{suggestion.query}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              
              {/* 显示详细的重试信息 */}
              {errorDetail && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <div className="text-sm font-medium text-red-800">
                    重试详情（共 {errorDetail.attempts} 次尝试）
                  </div>
                  
                  {errorDetail.sqls.map((sql, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded">
                          尝试 {index + 1}
                        </span>
                      </div>
                      
                      <div className="bg-white rounded border border-red-200 p-3 space-y-2">
                        <div>
                          <div className="text-xs font-medium text-gray-600 mb-1">生成的 SQL：</div>
                          <code className="text-xs text-gray-800 block bg-gray-50 p-2 rounded overflow-x-auto">
                            {sql}
                          </code>
                        </div>
                        
                        {errorDetail.errors[index] && (
                          <div>
                            <div className="text-xs font-medium text-red-600 mb-1">错误信息：</div>
                            <div className="text-xs text-red-700 bg-red-50 p-2 rounded">
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? '查询中...' : '执行查询'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
