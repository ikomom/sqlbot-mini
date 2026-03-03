import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Trash2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import QueryLogCard from './QueryLogCard'
import { useLogStore } from '@/stores/logStore'

interface QueryLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// 简单的 debounce 实现
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export default function QueryLogDialog({ open, onOpenChange }: QueryLogDialogProps) {
  const { logs, filters, setFilter, clearLogs, getFilteredLogs } = useLogStore()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.keyword)

  // 防抖更新关键词筛选
  const debouncedSetKeyword = useRef(
    debounce((keyword: string) => {
      setFilter('keyword', keyword)
    }, 300)
  ).current

  // 处理搜索输入变化
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      debouncedSetKeyword(value)
    },
    [debouncedSetKeyword]
  )

  // 获取筛选后的日志
  const filteredLogs = useMemo(() => getFilteredLogs(), [logs, filters])

  // 清空日志处理
  const handleClearLogs = useCallback(() => {
    clearLogs()
    setShowClearConfirm(false)
    setSearchInput('')
  }, [clearLogs])

  // 清除筛选
  const handleClearFilters = useCallback(() => {
    setFilter('status', 'all')
    setFilter('aiProvider', 'all')
    setFilter('keyword', '')
    setSearchInput('')
  }, [setFilter])

  // 同步 searchInput 与 filters.keyword
  useEffect(() => {
    if (filters.keyword === '' && searchInput !== '') {
      setSearchInput('')
    }
  }, [filters.keyword])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>查询日志</DialogTitle>
            {logs.length > 0 && (
              <div className="flex gap-2">
                {showClearConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">确认清空所有日志？</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleClearLogs}
                    >
                      确认
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClearConfirm(false)}
                    >
                      取消
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    清空日志
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {/* 筛选器区域 */}
        <div className="flex gap-3 py-4 border-b">
          {/* 状态筛选 */}
          <div className="flex-1">
            <Select
              value={filters.status}
              onValueChange={(value) => setFilter('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="success">仅成功</SelectItem>
                <SelectItem value="failed">仅失败</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AI Provider 筛选 */}
          <div className="flex-1">
            <Select
              value={filters.aiProvider}
              onValueChange={(value) => setFilter('aiProvider', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择模型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部模型</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 关键词搜索 */}
          <div className="flex-1 relative">
            <Input
              placeholder="搜索查询或 SQL..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* 日志列表区域 */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {logs.length === 0 ? (
            // 无日志状态
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="text-lg mb-2">暂无查询记录</div>
              <div className="text-sm">执行查询后将显示在这里</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            // 筛选无结果状态
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="text-lg mb-4">未找到匹配的日志</div>
              <Button variant="outline" onClick={handleClearFilters}>
                清除筛选
              </Button>
            </div>
          ) : (
            // 日志列表
            <div className="space-y-4 py-4">
              {filteredLogs.map((log) => (
                <QueryLogCard key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>

        {/* 底部统计 */}
        {logs.length > 0 && (
          <div className="border-t pt-3 text-sm text-gray-600 text-center">
            显示 {filteredLogs.length} / 总数 {logs.length} 条日志
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
