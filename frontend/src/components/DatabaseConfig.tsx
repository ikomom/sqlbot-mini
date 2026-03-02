import { useState } from 'react'
import { databaseApi } from '@/api'
import type { DatabaseConfig as DatabaseConfigType, DatabaseType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface DatabaseConfigProps {
  onConnect: (connected: boolean) => void
}

export default function DatabaseConfig({ onConnect }: DatabaseConfigProps) {
  const [config, setConfig] = useState<DatabaseConfigType>({
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: 'postgres',
    password: ''
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await databaseApi.connect(config)
      onConnect(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '连接失败')
      onConnect(false)
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (value: string) => {
    const type = value as DatabaseType
    setConfig({ 
      ...config, 
      type,
      port: type === 'mysql' ? 3306 : type === 'postgresql' ? 5432 : 0
    })
  }

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>数据库配置</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="db-type">数据库类型</Label>
            <Select value={config.type} onValueChange={handleTypeChange}>
              <SelectTrigger id="db-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="sqlite">SQLite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.type !== 'sqlite' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="db-host">主机</Label>
                <Input
                  id="db-host"
                  type="text"
                  value={config.host}
                  onChange={(e) => setConfig({ ...config, host: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="db-port">端口</Label>
                <Input
                  id="db-port"
                  type="number"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 0 })}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="db-name">数据库名</Label>
            <Input
              id="db-name"
              type="text"
              value={config.database}
              onChange={(e) => setConfig({ ...config, database: e.target.value })}
              required
            />
          </div>

          {config.type !== 'sqlite' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="db-username">用户名</Label>
                <Input
                  id="db-username"
                  type="text"
                  value={config.username}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="db-password">密码</Label>
                <Input
                  id="db-password"
                  type="password"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                />
              </div>
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? '连接中...' : '连接数据库'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
