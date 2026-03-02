# 查询日志功能设计文档

**日期：** 2026-03-03  
**功能：** 查询日志系统  
**状态：** 已批准

## 概述

为 SQL Bot Mini 添加查询日志功能，记录所有与 AI 的交互过程，包括自然语言查询、生成的 SQL、执行结果、重试过程和 AI 原始响应，方便用户回顾历史查询和开发者调试。

## 功能需求

### 核心功能

1. **日志记录**
   - 记录每次查询的完整信息（时间、查询内容、AI Provider、SQL、结果）
   - 记录所有重试过程（每次重试的 SQL 和错误信息）
   - 记录 AI 原始请求和响应（prompt、响应内容、token 使用）

2. **日志展示**
   - 顶部导航栏显示"查询日志"按钮，带徽章显示日志数量
   - 点击按钮弹出日志弹窗
   - 日志以卡片形式展示，支持展开/折叠查看详情

3. **日志筛选**
   - 按状态筛选（全部/成功/失败）
   - 按 AI Provider 筛选（全部/OpenAI/Anthropic/DeepSeek）
   - 按关键词搜索（搜索自然语言查询和 SQL 语句）

4. **日志管理**
   - 最多保存 20 条日志（FIFO 队列）
   - 支持清空所有日志
   - 日志存储在前端内存中（刷新页面后清空）

## 数据结构设计

### 前端日志条目结构

```typescript
interface QueryLogEntry {
  id: string                    // 唯一标识（UUID）
  timestamp: Date               // 查询时间
  naturalQuery: string          // 自然语言查询
  aiProvider: string            // AI Provider (openai/anthropic/deepseek)
  status: 'success' | 'failed'  // 执行状态
  
  // 主查询
  sql: string                   // 生成的 SQL
  rowCount?: number             // 返回行数（成功时）
  
  // 重试记录（如果有）
  retries?: Array<{
    attempt: number             // 第几次重试
    sql: string                 // 重试生成的 SQL
    error: string               // 导致重试的错误
    aiRequest: {
      prompt: string            // AI 请求 prompt
      schema_context: string    // 数据库结构信息
    }
    aiResponse: {
      raw_content: string       // AI 返回的原始内容
      model: string             // 使用的模型
      usage: {                  // Token 使用情况
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
      }
    }
  }>
  
  // 最终错误（如果失败）
  finalError?: string
  
  // 第一次尝试的 AI 交互信息
  aiRequest?: {
    prompt: string
    schema_context: string
  }
  aiResponse?: {
    raw_content: string
    model: string
    usage: object
  }
}
```

### Zustand Store 结构

```typescript
interface LogStore {
  logs: QueryLogEntry[]
  
  // 筛选状态
  filters: {
    status: 'all' | 'success' | 'failed'
    aiProvider: 'all' | 'openai' | 'anthropic' | 'deepseek'
    keyword: string
  }
  
  // 方法
  addLog: (log: QueryLogEntry) => void
  clearLogs: () => void
  setFilter: (key: string, value: string) => void
  filteredLogs: () => QueryLogEntry[]
}
```

### 后端 log_info 结构

```python
{
    "ai_provider": "deepseek",
    "natural_query": "统计用户表中各状态的数量",
    "timestamp": "2026-03-03 10:30:15",
    "attempts": [
        {
            "attempt": 1,
            "sql": "SELECT status, COUNT(*) FROM users GROUP BY status",
            "success": True,
            "row_count": 5,
            "error": None,
            "ai_request": {
                "prompt": "完整的 prompt 内容...",
                "schema_context": "数据库结构信息..."
            },
            "ai_response": {
                "raw_content": "AI 返回的原始文本",
                "model": "deepseek-chat",
                "usage": {
                    "prompt_tokens": 150,
                    "completion_tokens": 20,
                    "total_tokens": 170
                }
            }
        }
    ],
    "total_attempts": 1,
    "final_status": "success"
}
```

## 架构设计

### 前端架构

**新增组件：**

1. **stores/logStore.ts**
   - Zustand 状态管理
   - 管理日志数组和筛选状态
   - 提供添加、清空、筛选方法

2. **components/Header.tsx**
   - 顶部导航栏组件
   - 显示应用标题、日志按钮、数据库状态
   - 日志按钮带徽章显示日志数量

3. **components/QueryLogDialog.tsx**
   - 日志弹窗组件
   - 包含筛选器和日志列表
   - 使用 shadcn/ui Dialog 组件

4. **components/QueryLogCard.tsx**
   - 单条日志卡片组件
   - 支持展开/折叠查看详情
   - 显示 AI 原始响应（可展开）

5. **utils/formatters.ts**
   - 时间格式化工具函数
   - 格式：YYYY-MM-DD HH:mm:ss

**修改组件：**

1. **App.tsx**
   - 添加 Header 组件
   - 添加 QueryLogDialog 组件

2. **QueryInput.tsx**
   - 查询成功/失败时调用 `addLog`
   - 解析后端返回的 `log_info`
   - 构建完整的日志条目

### 后端架构

**修改文件：**

1. **main.py**
   - 修改 `/query` 端点
   - 收集每次尝试的详细信息
   - 构建 `log_info` 对象
   - 在 QueryResponse 中添加 `log_info` 字段

2. **ai_provider.py**
   - 修改 `generate_sql()` 返回值为元组：`(sql, metadata)`
   - 修改 `fix_sql_error()` 返回值为元组：`(sql, metadata)`
   - metadata 包含：prompt、raw_response、model、usage

**QueryResponse 模型更新：**

```python
class QueryResponse(BaseModel):
    sql: str
    columns: list
    data: list
    row_count: int
    log_info: Dict[str, Any]  # 新增字段
```

## UI/UX 设计

### 顶部导航栏

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 SQL Bot Mini          [📋 查询日志 (5)]  [🟢 数据库: 已连接] │
└─────────────────────────────────────────────────────────────┘
```

- 左侧：应用标题
- 右侧：查询日志按钮（带徽章）+ 数据库连接状态

### 日志弹窗

```
┌────────────────────────────────────────────────────┐
│  查询日志                                    [清空] [✕] │
├────────────────────────────────────────────────────┤
│  筛选: [全部状态 ▼] [全部模型 ▼] [🔍 搜索关键词]   │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────┐    │
│  │ 🟢 成功  2026-03-03 10:30:15  DeepSeek   │    │
│  │ 统计用户表中各状态的数量                  │    │
│  │ SQL: SELECT status, COUNT(*) ...         │    │
│  │ 返回: 5 行                                │    │
│  │ [查看详情 ▼]                              │    │
│  └──────────────────────────────────────────┘    │
│                                                    │
│  显示 3 / 20 条日志                               │
└────────────────────────────────────────────────────┘
```

### 日志卡片（展开状态）

**成功的查询（无重试）：**

```
┌──────────────────────────────────────────┐
│ 🟢 成功  2026-03-03 10:30:15  DeepSeek   │
│ 统计用户表中各状态的数量                  │
│ ─────────────────────────────────────    │
│ 生成的 SQL:                               │
│ SELECT status, COUNT(*) FROM users       │
│ GROUP BY status                          │
│                                          │
│ 执行结果: 5 行                            │
│                                          │
│ [查看 AI 原始响应 ▼]                      │
│   Prompt: 根据以下数据库结构...           │
│   响应: SELECT status...                 │
│   Token: 150/20/170                      │
│ [收起 ▲]                                 │
└──────────────────────────────────────────┘
```

**失败的查询（有重试）：**

```
┌──────────────────────────────────────────┐
│ 🔴 失败  2026-03-03 10:28:42  OpenAI     │
│ 查询用户信息                              │
│ ─────────────────────────────────────    │
│ 📍 尝试 1/3                               │
│   SQL: SELECT * FROM user                │
│   错误: Table 'user' doesn't exist       │
│   [查看 AI 原始响应 ▼]                    │
│                                          │
│ 📍 尝试 2/3                               │
│   SQL: SELECT * FROM users               │
│   错误: Column 'xyz' not found           │
│   [查看 AI 原始响应 ▼]                    │
│                                          │
│ 📍 尝试 3/3                               │
│   SQL: SELECT id, name FROM users        │
│   错误: Permission denied                │
│   [查看 AI 原始响应 ▼]                    │
│                                          │
│ 最终失败: 已达到最大重试次数              │
└──────────────────────────────────────────┘
```

### 交互细节

1. **卡片默认折叠**：只显示摘要信息
2. **点击"查看详情"**：展开显示完整 SQL 和结果
3. **点击"查看 AI 原始响应"**：再次展开显示调试信息
4. **清空按钮**：确认后清空所有日志
5. **日志排序**：最新的在最上面
6. **滚动区域**：弹窗内容区域可滚动，最大高度 70vh

### 颜色方案

- 成功：绿色指示器 + 绿色边框
- 失败：红色指示器 + 红色边框
- 代码块：灰色背景，等宽字体
- AI 响应区域：浅蓝色背景

## 筛选功能

### 筛选维度

1. **状态筛选**：全部状态 / 仅成功 / 仅失败
2. **AI Provider 筛选**：全部模型 / OpenAI / Anthropic / DeepSeek
3. **关键词搜索**：搜索自然语言查询和 SQL 语句（不区分大小写）

### 筛选逻辑

```typescript
filteredLogs: () => {
  return logs.filter(log => {
    // 状态筛选
    if (filters.status !== 'all' && log.status !== filters.status) {
      return false
    }
    
    // AI Provider 筛选
    if (filters.aiProvider !== 'all' && 
        log.aiProvider.toLowerCase() !== filters.aiProvider) {
      return false
    }
    
    // 关键词搜索
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      const matchQuery = log.naturalQuery.toLowerCase().includes(keyword)
      const matchSql = log.sql.toLowerCase().includes(keyword)
      return matchQuery || matchSql
    }
    
    return true
  })
}
```

### UI 交互

- 筛选器始终可见
- 实时筛选，选择或输入后立即生效
- 底部显示"显示 X / 总数 条日志"
- 筛选无结果时显示"未找到匹配的日志"

## 错误处理与边界情况

### 错误处理

1. **后端返回格式异常**
   - 使用默认值填充缺失字段
   - 确保前端不崩溃

2. **AI 原始响应过大**
   - 截断显示到 1000 字符
   - 添加"查看完整内容"按钮

3. **日志存储超限**
   - FIFO 队列，自动删除最旧的日志
   - 提示"已保存最近 20 条日志"

4. **网络请求失败**
   - 创建简化的日志条目
   - 标记为失败，记录错误信息

### 边界情况

1. **空日志状态**
   - 显示空状态插图
   - 提示："暂无查询记录，执行查询后将显示在这里"

2. **筛选无结果**
   - 显示"未找到匹配的日志"
   - 提供"清除筛选"按钮

3. **日志卡片内容过长**
   - SQL 语句超过 5 行自动折叠
   - 错误信息超过 3 行自动折叠
   - 自然语言查询超过 100 字符截断

4. **并发查询**
   - 每个查询独立记录
   - 使用 UUID 确保日志 ID 唯一

## 技术实现

### 依赖安装

**前端：**
```bash
pnpm add zustand uuid
pnpm add -D @types/uuid
```

**后端：**
无需新增依赖（使用 Python 标准库）

### 文件结构

**前端新增文件：**
```
frontend/src/
├── stores/
│   └── logStore.ts              # Zustand 日志状态管理
├── components/
│   ├── Header.tsx               # 顶部导航栏
│   ├── QueryLogDialog.tsx       # 日志弹窗
│   └── QueryLogCard.tsx         # 日志卡片
└── utils/
    └── formatters.ts            # 时间格式化工具
```

**后端修改文件：**
```
backend/
├── main.py                      # 修改 /query 端点
└── ai_provider.py               # 修改返回值结构
```

### 关键实现点

**1. Zustand Store：**
- 管理日志数组（最多 20 条）
- 管理筛选状态
- 提供筛选后的日志列表

**2. 后端 AI Provider：**
- 返回元组：`(sql, metadata)`
- metadata 包含：prompt、raw_response、model、usage

**3. 后端 main.py：**
- 收集每次尝试的详细信息
- 构建完整的 `log_info` 对象
- 在 QueryResponse 中返回

**4. 时间格式：**
- 统一使用：`YYYY-MM-DD HH:mm:ss`
- 后端：`datetime.now().strftime("%Y-%m-%d %H:%M:%S")`
- 前端：`toLocaleString()` 格式化

### 性能优化

1. **日志数量限制**：最多 20 条，避免内存占用过大
2. **虚拟滚动**：如果需要，使用 react-window 优化渲染
3. **AI 响应懒加载**：默认折叠，点击时才渲染详细内容
4. **防抖搜索**：关键词搜索使用 300ms 防抖

## 测试策略

### 前端测试

1. **Zustand Store 测试**
   - 添加日志（正常情况）
   - 日志数量限制（超过 20 条）
   - 筛选功能（状态、模型、关键词）
   - 清空日志

2. **组件测试**
   - QueryLogDialog：打开/关闭、筛选交互
   - QueryLogCard：展开/折叠、显示不同状态
   - Header：徽章数字显示、按钮点击

3. **集成测试**
   - 查询成功后日志自动添加
   - 查询失败后日志包含重试信息
   - 筛选后日志列表正确更新

### 后端测试

1. **单元测试（ai_provider.py）**
   - 测试 generate_sql 返回元组格式
   - 测试 fix_sql_error 返回元组格式
   - 测试 metadata 包含所有必需字段

2. **端到端测试（main.py）**
   - 测试成功查询返回 log_info
   - 测试失败查询返回 log_info（包含所有重试）
   - 测试 log_info 时间格式正确
   - 测试 attempts 数组结构正确

### 手动测试场景

1. **正常查询（无重试）**
   - 验证日志显示 1 次尝试，状态为成功
   - 验证 AI 原始响应可展开查看

2. **查询失败（有重试）**
   - 验证日志显示 3 次尝试
   - 验证每次尝试都有 SQL、错误信息、AI 响应

3. **筛选功能**
   - 测试状态筛选
   - 测试模型筛选
   - 测试关键词搜索

4. **日志数量限制**
   - 连续执行 25 次查询
   - 验证只保留最新 20 条

5. **边界情况**
   - 网络断开时查询
   - 后端返回异常格式
   - 超长 SQL 语句显示
   - 空日志状态显示

## 数据流

```
用户输入查询
    ↓
前端发送请求到 /query
    ↓
后端调用 AI generate_sql()
    ↓ (返回 sql + metadata)
记录第一次尝试信息
    ↓
执行 SQL
    ↓
成功？
├─ 是 → 构建 log_info (success) → 返回 QueryResponse
└─ 否 → 记录错误
        ↓
        还有重试机会？
        ├─ 是 → 调用 AI fix_sql_error()
        │       ↓ (返回 fixed_sql + metadata)
        │       记录重试信息
        │       ↓
        │       执行 fixed_sql
        │       ↓
        │       (循环最多 3 次)
        └─ 否 → 构建 log_info (failed) → 返回错误 + log_info
    ↓
前端接收响应
    ↓
解析 log_info
    ↓
调用 logStore.addLog()
    ↓
日志存储到 Zustand Store
    ↓
用户点击日志按钮查看
```

## 实现优先级

### P0（核心功能）
1. 后端返回 log_info
2. 前端 Zustand Store
3. 日志弹窗和卡片组件
4. 基础日志展示

### P1（重要功能）
1. 筛选功能
2. AI 原始响应展示
3. 重试记录展示
4. 顶部导航栏

### P2（优化功能）
1. 性能优化（防抖、懒加载）
2. 空状态和边界情况处理
3. 测试覆盖

## 后续扩展

1. **持久化存储**：支持 localStorage 或后端数据库
2. **导出功能**：导出日志为 JSON 或 CSV
3. **日志详情页**：单独页面查看某条日志的完整信息
4. **统计分析**：成功率、平均重试次数、常用查询等
5. **日志分享**：生成分享链接，方便团队协作调试

## 总结

本设计提供了一个完整的查询日志系统，能够记录所有与 AI 的交互过程，包括重试和原始响应，方便用户回顾历史查询和开发者调试。通过 Zustand 状态管理和 shadcn/ui 组件，实现了清晰的架构和良好的用户体验。
