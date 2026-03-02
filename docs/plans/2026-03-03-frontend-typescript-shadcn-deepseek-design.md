# SQL Bot Mini 前端现代化升级设计文档

**日期：** 2026-03-03  
**状态：** 已批准  
**作者：** OpenCode AI

## 概述

本设计文档描述了 SQL Bot Mini 项目的全面技术栈升级方案，包括：
1. 前端迁移到 TypeScript（完整类型化）
2. 集成 shadcn/ui 组件库和 Tailwind CSS（全面替换内联样式）
3. 后端添加 DeepSeek AI Provider 支持
4. 前端添加 AI Provider 选择器
5. API 层重构为 axios（替换 fetch）

## 目标

- **类型安全**：通过 TypeScript 严格模式消除运行时类型错误
- **UI 一致性**：使用 shadcn/ui 提供统一、现代的用户界面
- **AI 灵活性**：支持用户动态选择 OpenAI/Anthropic/DeepSeek
- **代码质量**：提升可维护性和开发体验

## 技术栈变更

### 前端

**新增依赖：**
- TypeScript 5.x
- Tailwind CSS 3.x + PostCSS + Autoprefixer
- shadcn/ui 组件库
- class-variance-authority, clsx, tailwind-merge
- lucide-react（图标库）

**保留依赖：**
- React 18
- Vite 5
- axios（已有）
- recharts（图表库）

### 后端

**无新增依赖**，使用现有 httpx 实现 DeepSeek API 调用

## 架构设计

### 1. 前端 TypeScript 配置

#### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### 类型系统架构

**目录结构：**
```
frontend/src/
├── types/
│   ├── database.ts    # 数据库相关类型
│   ├── query.ts       # 查询相关类型
│   ├── api.ts         # API 响应类型
│   └── index.ts       # 统一导出
```

**核心类型定义：**

```typescript
// types/database.ts
export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite'

export interface DatabaseConfig {
  type: DatabaseType
  host: string
  port: number
  database: string
  username: string
  password: string
}

export interface DatabaseStatus {
  connected: boolean
  config: DatabaseConfig | null
}

// types/query.ts
export type AIProvider = 'openai' | 'anthropic' | 'deepseek'

export interface QueryRequest {
  natural_query: string
  ai_provider?: AIProvider
}

export interface QueryResponse {
  sql: string
  columns: string[]
  data: Record<string, any>[]
  row_count: number
}

// types/api.ts
export interface ApiError {
  detail: string
}

export interface ApiResponse<T> {
  data?: T
  error?: ApiError
}
```

### 2. shadcn/ui 集成

#### 初始化配置

**components.json：**
```json
{
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

#### 需要安装的组件

- `button` - 所有按钮
- `input` - 输入框
- `textarea` - 文本域
- `select` - 下拉选择器
- `card` - 容器卡片
- `label` - 表单标签
- `alert` - 错误/成功提示
- `tabs` - 标签页（可选）

#### Tailwind CSS 配置

**tailwind.config.js：**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... 其他颜色
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 3. 后端 DeepSeek Provider

#### ai_provider.py 扩展

**新增方法：**

```python
async def _deepseek_generate(self, natural_query: str, schema_context: str) -> str:
    """使用 DeepSeek API 生成 SQL"""
    if not settings.deepseek_api_key:
        raise ValueError("DeepSeek API key not configured")
    
    prompt = self._build_prompt(natural_query, schema_context)
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.deepseek_base_url}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.deepseek_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": settings.deepseek_model,
                "messages": [
                    {"role": "system", "content": "You are a SQL expert. Generate only valid SQL queries without explanations."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1
            },
            timeout=30.0
        )
        response.raise_for_status()
        result = response.json()
        sql = result["choices"][0]["message"]["content"].strip()
        return self._extract_sql(sql)
```

**generate_sql 方法更新：**

```python
async def generate_sql(self, natural_query: str, schema_context: str) -> str:
    """Convert natural language to SQL using configured AI provider"""
    if self.provider == "openai":
        return await self._openai_generate(natural_query, schema_context)
    elif self.provider == "anthropic":
        return await self._anthropic_generate(natural_query, schema_context)
    elif self.provider == "deepseek":
        return await self._deepseek_generate(natural_query, schema_context)
    else:
        raise ValueError(f"Unsupported AI provider: {self.provider}")
```

#### config.py 扩展

**新增配置字段：**

```python
class Settings(BaseSettings):
    # ... 现有字段 ...
    
    # DeepSeek Settings
    deepseek_api_key: Optional[str] = None
    deepseek_model: str = "deepseek-chat"
    deepseek_base_url: str = "https://api.deepseek.com"
```

#### .env.example 更新

```env
# AI Provider Configuration
AI_PROVIDER=openai  # 可选值：openai, anthropic, deepseek
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-chat

# ... 其他配置 ...
```

### 4. API 层重构（axios）

#### 目录结构

```
frontend/src/api/
├── client.ts          # axios 实例配置
├── database.ts        # 数据库 API
├── query.ts           # 查询 API
└── index.ts           # 统一导出
```

#### client.ts

```typescript
import axios, { AxiosError } from 'axios'
import type { ApiError } from '@/types'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<ApiError>) => {
    const message = error.response?.data?.detail || error.message || '请求失败'
    throw new Error(message)
  }
)

export default apiClient
```

#### database.ts

```typescript
import apiClient from './client'
import type { DatabaseConfig, DatabaseStatus } from '@/types'

export const databaseApi = {
  connect: (config: DatabaseConfig) => 
    apiClient.post<{ status: string; message: string }>('/database/connect', config),
  
  getStatus: () => 
    apiClient.get<DatabaseStatus>('/database/status'),
  
  getSchema: () => 
    apiClient.get<{ schema: string }>('/database/schema'),
}
```

#### query.ts

```typescript
import apiClient from './client'
import type { QueryRequest, QueryResponse } from '@/types'

export const queryApi = {
  executeNaturalQuery: (request: QueryRequest) => 
    apiClient.post<QueryResponse>('/query', request),
  
  executeSql: (sql: string) => 
    apiClient.post<QueryResponse>('/query/sql', { sql }),
}
```

### 5. 组件重构

#### App.tsx

**状态管理：**
```typescript
const [connected, setConnected] = useState<boolean>(false)
const [queryResult, setQueryResult] = useState<QueryResponse | null>(null)
```

**样式策略：**
- 移除所有内联样式对象
- 使用 Tailwind CSS 类名
- 保持响应式布局

#### DatabaseConfig.tsx

**shadcn/ui 组件使用：**
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Label` + `Input` 组合
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`
- `Button`
- `Alert`, `AlertDescription`

**状态类型：**
```typescript
const [config, setConfig] = useState<DatabaseConfig>({
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: '',
  username: '',
  password: '',
})
const [loading, setLoading] = useState<boolean>(false)
const [error, setError] = useState<string | null>(null)
const [success, setSuccess] = useState<boolean>(false)
```

#### QueryInput.tsx

**新增功能：AI Provider 选择器**

**状态类型：**
```typescript
const [query, setQuery] = useState<string>('')
const [aiProvider, setAiProvider] = useState<AIProvider>('openai')
const [loading, setLoading] = useState<boolean>(false)
const [error, setError] = useState<string | null>(null)
```

**组件结构：**
```typescript
<Card>
  <CardHeader>
    <CardTitle>自然语言查询</CardTitle>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="ai-provider">AI 模型</Label>
          <Select value={aiProvider} onValueChange={setAiProvider}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI GPT-4</SelectItem>
              <SelectItem value="anthropic">Anthropic Claude</SelectItem>
              <SelectItem value="deepseek">DeepSeek</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="query">查询内容</Label>
          <Textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入你的查询，例如：显示所有用户的数量"
            rows={4}
          />
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? '查询中...' : '执行查询'}
        </Button>
      </div>
    </form>
  </CardContent>
</Card>
```

#### ChartDisplay.tsx

**Props 类型：**
```typescript
interface ChartDisplayProps {
  result: QueryResponse
}
```

**组件优化：**
- 使用 `Card` 包裹图表和表格
- 保留 recharts 图表渲染
- 使用 Tailwind CSS 美化表格样式

### 6. 配置文件更新

#### package.json 脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  }
}
```

#### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

## 实施顺序

1. **前端基础配置**
   - 安装 TypeScript 和相关依赖
   - 配置 tsconfig.json
   - 安装 Tailwind CSS 和 PostCSS
   - 初始化 shadcn/ui

2. **类型系统建立**
   - 创建 types/ 目录和类型定义
   - 配置路径别名

3. **后端 DeepSeek 集成**
   - 更新 config.py
   - 扩展 ai_provider.py
   - 更新 .env.example

4. **API 层重构**
   - 创建 axios client
   - 重写 database.ts 和 query.ts
   - 删除旧的 fetch 实现

5. **组件迁移**
   - 安装 shadcn/ui 组件
   - 逐个迁移组件到 TypeScript
   - 替换内联样式为 Tailwind CSS
   - 添加 AI Provider 选择器

6. **测试与验证**
   - 类型检查（tsc --noEmit）
   - 功能测试（数据库连接、查询执行）
   - UI 测试（响应式、交互）

7. **文档更新**
   - 更新 README.md
   - 更新 AGENTS.md

## 风险与缓解

### 风险 1：TypeScript 迁移导致构建失败
**缓解措施：**
- 使用严格模式但允许渐进式修复
- 先配置好类型系统再迁移组件
- 每个组件迁移后立即测试

### 风险 2：shadcn/ui 样式冲突
**缓解措施：**
- 完全移除旧的内联样式
- 使用 Tailwind CSS 的 preflight 重置样式
- 测试所有组件的视觉一致性

### 风险 3：DeepSeek API 兼容性问题
**缓解措施：**
- 参考 DeepSeek 官方文档确认 API 格式
- 添加详细的错误处理和日志
- 提供降级方案（使用其他 AI Provider）

### 风险 4：axios 迁移破坏现有功能
**缓解措施：**
- 保持 API 接口签名不变
- 统一错误处理格式
- 完整测试所有 API 调用

## 成功标准

- ✅ 所有 TypeScript 类型检查通过（无错误）
- ✅ 所有组件使用 shadcn/ui，无内联样式
- ✅ DeepSeek API 正常工作
- ✅ AI Provider 选择器功能正常
- ✅ 所有现有功能保持正常（数据库连接、查询执行、图表展示）
- ✅ 构建成功，无警告
- ✅ 文档更新完整

## 预计工作量

**总计：4-6 小时**

- 前端配置（TypeScript + Tailwind + shadcn/ui）：1 小时
- 类型系统建立：0.5 小时
- 后端 DeepSeek 集成：0.5 小时
- API 层重构：1 小时
- 组件迁移（4 个组件）：2-3 小时
- 测试与文档：1 小时

## 后续优化建议

1. **暗色模式支持** - shadcn/ui 原生支持，可快速实现
2. **表单验证** - 使用 react-hook-form + zod
3. **状态管理** - 如果应用复杂度增加，考虑 zustand 或 jotai
4. **单元测试** - 使用 Vitest + React Testing Library
5. **E2E 测试** - 使用 Playwright

## 结论

本设计方案通过一次性全面升级，将 SQL Bot Mini 项目的前端技术栈现代化，提升类型安全、UI 一致性和开发体验。同时扩展了 AI Provider 支持，为用户提供更多选择。实施顺序清晰，风险可控，预计工作量合理。
