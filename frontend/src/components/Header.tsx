import { Terminal, Database, FileCode, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLogStore } from '@/stores/logStore'

interface HeaderProps {
  connected: boolean
  connecting: boolean
  onOpenLog: () => void
}

export default function Header({ connected, connecting, onOpenLog }: HeaderProps) {
  const { logs } = useLogStore()

  return (
    <header className="relative border-b border-cyan-500/20 backdrop-blur-md bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80">
      {/* 顶部发光线 */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
      
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 左侧：品牌标识 */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Terminal className="w-8 h-8 text-cyan-400" />
              <div className="absolute inset-0 bg-cyan-400/20 blur-lg rounded-full" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-cyan-400 text-glow-cyan font-mono">SQL</span>
                <span className="text-white mx-1">/</span>
                <span className="text-purple-400 text-glow-magenta">BOT</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono tracking-wider">
                NATURAL LANGUAGE → SQL QUERY
              </p>
            </div>
          </div>

          {/* 右侧：状态和操作 */}
          <div className="flex items-center space-x-6">
            {/* 查询日志按钮 */}
            <Button
              variant="ghost"
              onClick={onOpenLog}
              className="relative group h-9 px-4 min-w-[100px] hover:bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300"
            >
              <FileCode className="w-4 h-4 text-cyan-400 mr-2" />
              <span className="text-cyan-100 font-mono text-sm">日志</span>
              {logs.length > 0 && (
                <Badge 
                  variant="default" 
                  className="ml-2 bg-cyan-500 text-slate-900 font-mono text-xs px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center"
                >
                  {logs.length}
                </Badge>
              )}
              <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/5 rounded transition-colors duration-300" />
            </Button>

            {/* 数据库状态 */}
            <div className="flex items-center space-x-3 h-9 px-4 rounded border border-slate-700/50 bg-slate-800/30">
              <Database className="w-4 h-4 text-slate-400" />
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Circle
                    className={`w-2 h-2 transition-all duration-300 ${
                      connecting
                        ? 'fill-yellow-400 text-yellow-400 animate-pulse'
                        : connected
                        ? 'fill-green-400 text-green-400'
                        : 'fill-red-400 text-red-400'
                    }`}
                  />
                  {connected && (
                    <div className="absolute inset-0 bg-green-400/50 blur-sm rounded-full animate-pulse" />
                  )}
                </div>
                <span className={`text-xs font-mono tracking-wide ${
                  connecting
                    ? 'text-yellow-400'
                    : connected
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {connecting ? '连接中' : connected ? '在线' : '离线'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部发光线 */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
    </header>
  )
}
