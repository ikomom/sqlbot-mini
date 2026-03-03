import { useState } from 'react'
import { Search, FileText, Circle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import QueryLogDialog from './QueryLogDialog'
import { useLogStore } from '@/stores/logStore'

interface HeaderProps {
  connected: boolean  // 数据库连接状态
}

export default function Header({ connected }: HeaderProps) {
  const { logs } = useLogStore()
  const [logDialogOpen, setLogDialogOpen] = useState(false)

  return (
    <>
      <Card className="w-full">
        <div className="flex items-center justify-between px-6 py-4">
          {/* 左侧：应用标题 */}
          <div className="flex items-center gap-2">
            <Search className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-800">SQL Bot Mini</h1>
          </div>

          {/* 右侧：操作区域 */}
          <div className="flex items-center gap-4">
            {/* 查询日志按钮 */}
            <Button
              variant="outline"
              onClick={() => setLogDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              <span>查询日志</span>
              {logs.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {logs.length}
                </Badge>
              )}
            </Button>

            {/* 数据库状态指示器 */}
            <div className="flex items-center gap-2">
              <Circle
                className={`h-3 w-3 ${
                  connected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'
                }`}
              />
              <span className={`text-sm font-medium ${
                connected ? 'text-green-700' : 'text-red-700'
              }`}>
                数据库: {connected ? '已连接' : '未连接'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 查询日志对话框 */}
      <QueryLogDialog
        open={logDialogOpen}
        onOpenChange={setLogDialogOpen}
      />
    </>
  )
}
