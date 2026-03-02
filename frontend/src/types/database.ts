// 数据库类型
export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite'

// 数据库配置
export interface DatabaseConfig {
  type: DatabaseType
  host: string
  port: number
  database: string
  username: string
  password: string
}

// 数据库状态
export interface DatabaseStatus {
  connected: boolean
  config: DatabaseConfig | null
}

// 数据库 Schema
export interface DatabaseSchema {
  schema: string
}
