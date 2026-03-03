import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Trash2, Filter, Search, FileCode } from 'lucide-react'
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

  const debouncedSetKeyword = useRef(
    debounce((keyword: string) => {
      setFilter('keyword', keyword)
    }, 300)
  ).current

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      debouncedSetKeyword(value)
    },
    [debouncedSetKeyword]
  )

  const filteredLogs = useMemo(() => getFilteredLogs(), [logs, filters])

  const handleClearLogs = useCallback(() => {
    clearLogs()
    setShowClearConfirm(false)
    setSearchInput('')
  }, [clearLogs])

  const handleClearFilters = useCallback(() => {
    setFilter('status', 'all')
    setFilter('aiProvider', 'all')
    setFilter('keyword', '')
    setSearchInput('')
  }, [setFilter])

  useEffect(() => {
    if (filters.keyword === '' && searchInput !== '') {
      setSearchInput('')
    }
  }, [filters.keyword])

  const hasActiveFilters = filters.status !== 'all' || filters.aiProvider !== 'all' || filters.keyword !== ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 flex flex-col">
        {/* 顶部装饰线 */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        
        {/* 标题栏 */}
        <DialogHeader className="px-6 py-3 border-b border-cyan-500/20 bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <DialogTitle className="text-lg font-mono text-cyan-100 tracking-wide">
              查询日志
            </DialogTitle>
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs font-mono rounded border border-cyan-500/30">
              {logs.length}
            </span>
          </div>
        </DialogHeader>

        {/* 筛选栏 - 紧凑布局 */}
        <div className="px-6 py-3 border-b border-cyan-500/20 bg-slate-900/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* 状态筛选 */}
            <Select value={filters.status} onValueChange={(value) => setFilter('status', value)}>
              <SelectTrigger className="w-32 h-8 bg-slate-800/50 border-cyan-500/30 text-cyan-100 font-mono text-xs hover:border-cyan-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-cyan-500/30">
                <SelectItem value="all" className="font-mono text-xs text-cyan-100 focus:bg-cyan-500/20">全部</SelectItem>
                <SelectItem value="success" className="font-mono text-xs text-green-400 focus:bg-cyan-500/20">成功</SelectItem>
                <SelectItem value="failed" className="font-mono text-xs text-red-400 focus:bg-cyan-500/20">失败</SelectItem>
              </SelectContent>
            </Select>

            {/* AI 模型筛选 */}
            <Select value={filters.aiProvider} onValueChange={(value) => setFilter('aiProvider', value)}>
              <SelectTrigger className="w-32 h-8 bg-slate-800/50 border-cyan-500/30 text-cyan-100 font-mono text-xs hover:border-cyan-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-cyan-500/30">
                <SelectItem value="all" className="font-mono text-xs text-cyan-100 focus:bg-cyan-500/20">全部</SelectItem>
                <SelectItem value="openai" className="font-mono text-xs text-cyan-100 focus:bg-cyan-500/20">OpenAI</SelectItem>
                <SelectItem value="anthropic" className="font-mono text-xs text-cyan-100 focus:bg-cyan-500/20">Anthropic</SelectItem>
                <SelectItem value="deepseek" className="font-mono text-xs text-cyan-100 focus:bg-cyan-500/20">DeepSeek</SelectItem>
              </SelectContent>
            </Select>

            {/* 关键词搜索 */}
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <Input
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="搜索..."
                className="h-8 pl-8 bg-slate-800/50 border-cyan-500/30 text-cyan-100 placeholder:text-slate-500 font-mono text-xs focus:border-cyan-400"
              />
            </div>

            {/* 操作按钮 */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 text-xs font-mono text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              >
                清除
              </Button>
            )}
            
            {logs.length > 0 && (
              !showClearConfirm ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearConfirm(true)}
                  className="h-8 text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  清空
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-red-400">确认?</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearLogs}
                    className="h-8 px-2 text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    是
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClearConfirm(false)}
                    className="h-8 px-2 text-xs font-mono text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                  >
                    否
                  </Button>
                </div>
              )
            )}
          </div>
        </div>

        {/* 日志列表 - 可滚动区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FileCode className="w-16 h-16 text-slate-700 mb-4 opacity-50" />
              <p className="text-slate-500 font-mono text-sm">
                {logs.length === 0 ? '暂无日志' : '无匹配日志'}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <QueryLogCard log={log} />
              </div>
            ))
          )}
        </div>

        {/* 底部装饰线 */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      </DialogContent>
    </Dialog>
  )
}
