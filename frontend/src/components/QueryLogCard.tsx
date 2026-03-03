import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QueryLogEntry } from '@/types/log'
import { formatTimestamp, truncateText } from '@/utils/formatters'

interface QueryLogCardProps {
  log: QueryLogEntry
}

export default function QueryLogCard({ log }: QueryLogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAiResponse, setShowAiResponse] = useState(false)

  // 状态指示器
  const statusIndicator = log.status === 'success' ? '🟢' : '🔴'
  const statusText = log.status === 'success' ? '成功' : '失败'
  const borderColor = log.status === 'success' ? 'border-green-500' : 'border-red-500'

  // 结果摘要
  const getSummary = () => {
    if (log.status === 'success') {
      return `返回 ${log.rowCount || 0} 行`
    } else {
      const retryCount = log.retries?.length || 0
      return `尝试 ${retryCount} 次后失败`
    }
  }

  // 获取 SQL 第一行
  const getSqlPreview = () => {
    const firstLine = log.sql.split('\n')[0]
    return truncateText(firstLine, 80)
  }

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            {/* 状态和基本信息 */}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-lg">{statusIndicator}</span>
              <span className="font-medium">{statusText}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-600">{formatTimestamp(log.timestamp)}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-600">{log.aiProvider}</span>
            </div>

            {/* 自然语言查询 */}
            <div className="text-sm">
              <span className="font-medium text-gray-700">查询：</span>
              <span className="text-gray-900">
                {truncateText(log.naturalQuery, 100)}
              </span>
            </div>

            {/* SQL 预览 */}
            <div className="text-sm">
              <span className="font-medium text-gray-700">SQL：</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                {getSqlPreview()}
              </code>
            </div>

            {/* 结果摘要 */}
            <div className="text-sm">
              <span className="font-medium text-gray-700">结果：</span>
              <span className="text-gray-900">{getSummary()}</span>
            </div>
          </div>

          {/* 查看详情按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                收起
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                查看详情
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {/* 展开内容 */}
      {isExpanded && (
        <CardContent className="space-y-4 border-t pt-4">
          {/* 完整 SQL */}
          <div>
            <div className="font-medium text-sm text-gray-700 mb-2">完整 SQL：</div>
            <pre className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
              {log.sql}
            </pre>
          </div>

          {/* 成功结果 */}
          {log.status === 'success' && (
            <div>
              <div className="font-medium text-sm text-gray-700">
                返回行数：<span className="text-green-600">{log.rowCount || 0}</span>
              </div>
            </div>
          )}

          {/* 失败重试记录 */}
          {log.status === 'failed' && log.retries && log.retries.length > 0 && (
            <div>
              <div className="font-medium text-sm text-gray-700 mb-2">重试记录：</div>
              <div className="space-y-3">
                {log.retries.map((retry, index) => (
                  <div key={index} className="border border-red-200 rounded p-3 bg-red-50">
                    <div className="font-medium text-sm text-red-700 mb-2">
                      尝试 {retry.attempt}/{log.retries!.length}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">SQL：</div>
                        <pre className="bg-white p-2 rounded text-xs font-mono overflow-x-auto border">
                          {retry.sql}
                        </pre>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">错误信息：</div>
                        <div className="bg-white p-2 rounded text-xs text-red-600 border">
                          {retry.error}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 最终错误 */}
          {log.status === 'failed' && log.finalError && (
            <div>
              <div className="font-medium text-sm text-gray-700 mb-2">最终错误：</div>
              <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-600">
                {log.finalError}
              </div>
            </div>
          )}

          {/* 查看 AI 原始响应按钮 */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAiResponse(!showAiResponse)}
            >
              {showAiResponse ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  隐藏 AI 原始响应
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  查看 AI 原始响应
                </>
              )}
            </Button>
          </div>

          {/* AI 原始响应 */}
          {showAiResponse && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4 space-y-4">
              {/* 成功时的 AI 响应 */}
              {log.status === 'success' && log.aiRequest && log.aiResponse && (
                <>
                  <div>
                    <div className="font-medium text-sm text-blue-900 mb-2">Prompt：</div>
                    <pre className="bg-white p-3 rounded text-xs font-mono overflow-x-auto border max-h-60">
                      {log.aiRequest.prompt}
                    </pre>
                  </div>

                  <div>
                    <div className="font-medium text-sm text-blue-900 mb-2">AI 响应内容：</div>
                    <pre className="bg-white p-3 rounded text-xs font-mono overflow-x-auto border max-h-60">
                      {log.aiResponse.raw_content}
                    </pre>
                  </div>

                  <div>
                    <div className="font-medium text-sm text-blue-900 mb-2">Token 使用情况：</div>
                    <div className="bg-white p-3 rounded text-sm border">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="text-gray-600">Prompt：</span>
                          <span className="font-mono ml-2">
                            {(log.aiResponse.usage as any)?.prompt_tokens || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Completion：</span>
                          <span className="font-mono ml-2">
                            {(log.aiResponse.usage as any)?.completion_tokens || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total：</span>
                          <span className="font-mono ml-2">
                            {(log.aiResponse.usage as any)?.total_tokens || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 失败时的 AI 响应（显示每次重试） */}
              {log.status === 'failed' && log.retries && log.retries.length > 0 && (
                <div className="space-y-4">
                  {log.retries.map((retry, index) => (
                    <div key={index} className="border-t border-blue-300 pt-4 first:border-t-0 first:pt-0">
                      <div className="font-medium text-sm text-blue-900 mb-3">
                        尝试 {retry.attempt} 的 AI 响应：
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-blue-800 mb-1">Prompt：</div>
                          <pre className="bg-white p-2 rounded text-xs font-mono overflow-x-auto border max-h-40">
                            {retry.aiRequest.prompt}
                          </pre>
                        </div>

                        <div>
                          <div className="text-xs text-blue-800 mb-1">AI 响应内容：</div>
                          <pre className="bg-white p-2 rounded text-xs font-mono overflow-x-auto border max-h-40">
                            {retry.aiResponse.raw_content}
                          </pre>
                        </div>

                        <div>
                          <div className="text-xs text-blue-800 mb-1">Token 使用：</div>
                          <div className="bg-white p-2 rounded text-xs border">
                            <span className="text-gray-600">Prompt: </span>
                            <span className="font-mono">{retry.aiResponse.usage.prompt_tokens}</span>
                            <span className="text-gray-600 ml-3">Completion: </span>
                            <span className="font-mono">{retry.aiResponse.usage.completion_tokens}</span>
                            <span className="text-gray-600 ml-3">Total: </span>
                            <span className="font-mono">{retry.aiResponse.usage.total_tokens}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
