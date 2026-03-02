import { useState, useEffect } from 'react'
import { queryApi, databaseApi } from '@/api'
import type { QueryResponse, AIProvider } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lightbulb } from 'lucide-react'

interface QueryInputProps {
  onQueryResult: (result: QueryResponse) => void
}

export default function QueryInput({ onQueryResult }: QueryInputProps) {
  const [query, setQuery] = useState<string>('')
  const [aiProvider, setAiProvider] = useState<AIProvider>('deepseek')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

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

    try {
      const result = await queryApi.executeNaturalQuery({
        natural_query: query,
        ai_provider: aiProvider
      })
      onQueryResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
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
              placeholder="输入你的查询，例如：显示所有用户的数量"
              rows={4}
              className="resize-y"
            />
          </div>

          {/* 查询提示词 */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lightbulb className="w-4 h-4" />
                <span>快速查询示例：</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1.5 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition-colors border border-indigo-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? '查询中...' : '执行查询'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
