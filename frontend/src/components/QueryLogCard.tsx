import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Code2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QueryLogEntry } from '@/types/log'
import { formatTimestamp, truncateText } from '@/utils/formatters'

interface QueryLogCardProps {
  log: QueryLogEntry
}

export default function QueryLogCard({ log }: QueryLogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAiResponse, setShowAiResponse] = useState(false)

  const isSuccess = log.status === 'success'
  const statusColor = isSuccess ? 'text-green-400' : 'text-red-400'
  const borderColor = isSuccess ? 'border-green-500/30' : 'border-red-500/30'
  const bgGradient = isSuccess 
    ? 'from-green-950/20 to-green-900/10' 
    : 'from-red-950/20 to-red-900/10'

  const getSummary = () => {
    if (isSuccess) {
      return `${log.rowCount || 0}行`
    } else {
      const retryCount = log.retries?.length || 0
      return `重试${retryCount}次后失败`
    }
  }

  const getSqlPreview = () => {
    const firstLine = log.sql.split('\n')[0]
    return truncateText(firstLine, 60)
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border ${borderColor} bg-gradient-to-br ${bgGradient} backdrop-blur-sm`}>
      {/* 顶部状态线 */}
      <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent ${isSuccess ? 'via-green-400' : 'via-red-400'} to-transparent opacity-50`} />
      
      {/* 主内容 */}
      <div className="p-4 space-y-3">
        {/* 头部信息 */}
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            {/* 状态行 */}
            <div className="flex items-center space-x-3 text-xs font-mono">
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className={`font-semibold ${statusColor}`}>
                {isSuccess ? '成功' : '失败'}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">{formatTimestamp(log.timestamp)}</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400 uppercase">{log.aiProvider}</span>
            </div>

            {/* 查询内容 */}
            <div className="text-sm">
              <span className="text-slate-500 font-mono text-xs">查询:</span>
              <p className="text-cyan-100 mt-1">
                {truncateText(log.naturalQuery, 120)}
              </p>
            </div>

            {/* SQL 预览 */}
            <div className="text-sm">
              <span className="text-slate-500 font-mono text-xs">SQL:</span>
              <code className="block text-xs bg-slate-900/50 px-3 py-2 rounded font-mono text-cyan-300 mt-1 border border-cyan-500/10">
                {getSqlPreview()}
              </code>
            </div>

            {/* 结果摘要 */}
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-slate-500">结果:</span>
              <span className={statusColor}>{getSummary()}</span>
            </div>
          </div>

          {/* 展开按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 font-mono text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                隐藏
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                详情
              </>
            )}
          </Button>
        </div>

        {/* 展开详情 */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-cyan-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* 完整 SQL */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-mono text-cyan-300 tracking-wider">完整 SQL</span>
              </div>
              <pre className="text-xs font-mono text-cyan-100 bg-slate-950/50 p-3 rounded overflow-x-auto border border-cyan-500/10">
                {log.sql}
              </pre>
            </div>

            {/* AI 请求/响应 */}
            {log.aiRequest && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs font-mono text-purple-300 tracking-wider">AI 交互</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAiResponse(!showAiResponse)}
                    className="text-xs font-mono text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                  >
                    {showAiResponse ? '隐藏' : '显示'}
                  </Button>
                </div>
                
                {showAiResponse && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <div className="text-xs font-mono text-slate-400 mb-1">请求:</div>
                      <pre className="text-xs font-mono text-slate-300 bg-slate-950/50 p-3 rounded overflow-x-auto border border-purple-500/10 max-h-40">
                        {typeof log.aiRequest === 'string' ? log.aiRequest : JSON.stringify(log.aiRequest, null, 2)}
                      </pre>
                    </div>
                    {log.aiResponse && (
                      <div>
                        <div className="text-xs font-mono text-slate-400 mb-1">响应:</div>
                        <pre className="text-xs font-mono text-slate-300 bg-slate-950/50 p-3 rounded overflow-x-auto border border-purple-500/10 max-h-40">
                          {typeof log.aiResponse === 'string' ? log.aiResponse : JSON.stringify(log.aiResponse, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 重试记录 */}
            {log.retries && log.retries.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xs font-mono text-yellow-400 tracking-wider">重试历史（{log.retries.length}次）</span>
                </div>
                <div className="space-y-3">
                  {log.retries.map((retry, index) => (
                    <div key={index} className="rounded border border-yellow-500/20 bg-yellow-950/10 p-3 space-y-2">
                      <div className="text-xs font-mono text-yellow-400">
                        第{retry.attempt}次
                      </div>
                      <div>
                        <div className="text-xs font-mono text-slate-400 mb-1">SQL:</div>
                        <code className="text-xs font-mono text-yellow-300 block bg-slate-950/50 p-2 rounded overflow-x-auto border border-yellow-500/10">
                          {retry.sql}
                        </code>
                      </div>
                      {retry.error && (
                        <div>
                          <div className="text-xs font-mono text-slate-400 mb-1">错误:</div>
                          <div className="text-xs font-mono text-red-400 bg-red-950/30 p-2 rounded border border-red-500/20">
                            {retry.error}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 最终错误 */}
            {log.finalError && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-mono text-red-400 tracking-wider">最终错误</span>
                </div>
                <div className="text-xs font-mono text-red-300 bg-red-950/30 p-3 rounded border border-red-500/20">
                  {log.finalError}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部装饰线 */}
      <div className={`absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent ${isSuccess ? 'via-green-500/30' : 'via-red-500/30'} to-transparent`} />
    </div>
  )
}
