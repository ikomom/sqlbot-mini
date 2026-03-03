# 查询日志功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 实现完整的查询日志系统，记录所有 AI 交互过程

**架构：** 后端修改 AI Provider 返回元组并在 /query 端点收集日志信息；前端使用 Zustand 管理日志状态，shadcn/ui 组件展示日志弹窗和卡片

**技术栈：** Zustand, uuid, shadcn/ui Dialog, Python datetime, FastAPI

---

## 任务 1：安装前端依赖

**文件：**
- 修改：`frontend/package.json`

**步骤 1：安装 zustand 和 uuid**

运行：`cd frontend && pnpm add zustand uuid && pnpm add -D @types/uuid`

预期：依赖成功安装到 package.json

**步骤 2：验证安装**

运行：`cd frontend && pnpm list zustand uuid`

预期：显示已安装的版本

**步骤 3：提交**

```bash
git add frontend/package.json frontend/pnpm-lock.yaml
git commit -m "chore: 添加 zustand 和 uuid 依赖"
```

---

## 任务 2：创建前端类型定义

**文件：**
- 创建：`frontend/src/types/log.ts`

**步骤 1：创建日志类型文件**

```typescript
// frontend/src/types/log.ts

export interface QueryLogEntry {
  id: string
  timestamp: Date
  naturalQuery: string
  aiProvider: string
  status: 'success' | 'failed'
  sql: string
  rowCount?: number
  retries?: Array<{
    attempt: number
    sql: string
    error: string
    aiRequest: {
      prompt: string
      schema_context: string
    }
    aiResponse: {
      raw_content: string
      model: string
      usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
      }
    }
  }>
  finalError?: string
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

export interface LogStore {
  logs: QueryLogEntry[]
  filters: {
    status: 'all' | 'success' | 'failed'
    aiProvider: 'all' | 'openai' | 'anthropic' | 'deepseek'
    keyword: string
  }
  addLog: (log: QueryLogEntry) => void
  clearLogs: () => void
  setFilter: (key: string, value: string) => void
  getFilteredLogs: () => QueryLogEntry[]
}
```

**步骤 2：更新 index.ts 导出**

修改：`frontend/src/types/index.ts`

添加：`export * from './log'`

**步骤 3：提交**

```bash
git add frontend/src/types/log.ts frontend/src/types/index.ts
git commit -m "feat: 添加查询日志类型定义"
```

---

## 任务 3：创建时间格式化工具

**文件：**
- 创建：`frontend/src/utils/formatters.ts`

**步骤 1：创建格式化函数**

```typescript
// frontend/src/utils/formatters.ts

/**
 * 格式化时间为 YYYY-MM-DD HH:mm:ss
 */
export function formatTimestamp(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 截断长文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
```

**步骤 2：提交**

```bash
git add frontend/src/utils/formatters.ts
git commit -m "feat: 添加时间格式化工具函数"
```

---

## 任务 4：创建 Zustand Store

**文件：**
- 创建：`frontend/src/stores/logStore.ts`

**步骤 1：创建 Store**

```typescript
// frontend/src/stores/logStore.ts

import { create } from 'zustand'
import type { QueryLogEntry, LogStore } from '@/types'

export const useLogStore = create<LogStore>((set, get) => ({
  logs: [],
  filters: {
    status: 'all',
    aiProvider: 'all',
    keyword: ''
  },
  
  addLog: (log: QueryLogEntry) => set((state) => {
    const newLogs = [log, ...state.logs].slice(0, 20) // 保留最新 20 条
    return { logs: newLogs }
  }),
  
  clearLogs: () => set({ 
    logs: [], 
    filters: { status: 'all', aiProvider: 'all', keyword: '' } 
  }),
  
  setFilter: (key: string, value: string) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),
  
  getFilteredLogs: () => {
    const { logs, filters } = get()
    
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
}))
```

**步骤 2：提交**

```bash
git add frontend/src/stores/logStore.ts
git commit -m "feat: 创建 Zustand 日志状态管理"
```


---

## 任务 5：后端修改 AI Provider 返回值

**文件：**
- 修改：`backend/ai_provider.py`

**步骤 1：修改 _openai_generate 方法**

找到 `_openai_generate` 方法，修改返回值为元组：

```python
async def _openai_generate(self, natural_query: str, schema_context: str) -> Tuple[str, Dict]:
    """使用 OpenAI API 生成 SQL，返回 (sql, metadata)"""
    prompt = f"""根据以下数据库结构生成 SQL 查询。

数据库结构:
{schema_context}

用户查询: {natural_query}

只返回 SQL 语句，不要任何解释。"""
    
    try:
        logger.info(f"Calling OpenAI API with model: {settings.openai_model}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": settings.openai_model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0
                }
            )
            response.raise_for_status()
            result = response.json()
            
            raw_content = result['choices'][0]['message']['content']
            sql = raw_content.strip()
            
            # 构建 metadata
            metadata = {
                "prompt": prompt,
                "schema_context": schema_context,
                "raw_response": raw_content,
                "model": settings.openai_model,
                "usage": result.get('usage', {})
            }
            
            logger.info(f"OpenAI API call successful, SQL generated")
            return sql, metadata
            
    except httpx.HTTPStatusError as e:
        logger.error(f"OpenAI API HTTP error: {e.response.status_code} - {e.response.text}")
        raise ValueError(f"OpenAI API 错误: {e.response.status_code}")
    except httpx.RequestError as e:
        logger.error(f"OpenAI API request error: {str(e)}")
        raise ValueError(f"网络请求失败: {str(e)}")
    except Exception as e:
        logger.error(f"OpenAI API unknown error: {str(e)}")
        raise ValueError(f"未知错误: {str(e)}")
```

**步骤 2：修改 _anthropic_generate 方法**

类似地修改 Anthropic 方法返回元组。

**步骤 3：修改 _deepseek_generate 方法**

类似地修改 DeepSeek 方法返回元组。

**步骤 4：修改 generate_sql 方法**

```python
async def generate_sql(self, natural_query: str, schema_context: str) -> Tuple[str, Dict]:
    """Convert natural language to SQL using configured AI provider，返回 (sql, metadata)"""
    if self.provider == "openai":
        return await self._openai_generate(natural_query, schema_context)
    elif self.provider == "anthropic":
        return await self._anthropic_generate(natural_query, schema_context)
    elif self.provider == "deepseek":
        return await self._deepseek_generate(natural_query, schema_context)
    else:
        raise ValueError(f"Unsupported AI provider: {self.provider}")
```

**步骤 5：修改 fix_sql_error 方法**

类似地修改返回元组。

**步骤 6：添加 Tuple 导入**

在文件顶部添加：`from typing import Optional, Tuple, Dict`

**步骤 7：提交**

```bash
git add backend/ai_provider.py
git commit -m "refactor: AI Provider 返回元组 (sql, metadata)"
```

---

## 任务 6：后端修改 main.py 添加 log_info

**文件：**
- 修改：`backend/main.py`

**步骤 1：修改 QueryResponse 模型**

```python
class QueryResponse(BaseModel):
    sql: str
    columns: list
    data: list
    row_count: int
    log_info: Dict[str, Any]  # 新增字段
```

**步骤 2：修改 /query 端点**

```python
from datetime import datetime

@app.post("/query", response_model=QueryResponse)
async def execute_natural_query(request: QueryRequest):
    """Convert natural language to SQL and execute with auto-retry on errors"""
    try:
        # Check database connection
        if not db_manager.test_connection():
            raise HTTPException(status_code=400, detail="Database not connected")
        
        # Get schema context
        schema_context = db_manager.get_schema_context()
        
        # 记录开始时间
        start_time = datetime.now()
        
        # Generate SQL using AI
        ai_provider = AIProvider(provider=request.ai_provider)
        sql, ai_metadata = await ai_provider.generate_sql(request.natural_query, schema_context)
        
        # 收集所有尝试记录
        attempts = []
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Attempt {attempt + 1}/{max_retries}: Executing SQL")
                result = db_manager.execute_query(sql)
                
                # 记录成功的尝试
                attempts.append({
                    "attempt": attempt + 1,
                    "sql": sql,
                    "success": True,
                    "row_count": result["row_count"],
                    "error": None,
                    "ai_request": {
                        "prompt": ai_metadata["prompt"],
                        "schema_context": ai_metadata["schema_context"]
                    },
                    "ai_response": {
                        "raw_content": ai_metadata["raw_response"],
                        "model": ai_metadata["model"],
                        "usage": ai_metadata.get("usage", {})
                    }
                })
                
                # 构建 log_info
                log_info = {
                    "ai_provider": request.ai_provider or settings.ai_provider,
                    "natural_query": request.natural_query,
                    "timestamp": start_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "attempts": attempts,
                    "total_attempts": len(attempts),
                    "final_status": "success"
                }
                
                # 成功执行
                return QueryResponse(
                    sql=sql,
                    columns=result["columns"],
                    data=result["data"],
                    row_count=result["row_count"],
                    log_info=log_info
                )
            except Exception as e:
                error_msg = str(e)
                
                # 记录失败的尝试
                attempts.append({
                    "attempt": attempt + 1,
                    "sql": sql,
                    "success": False,
                    "error": error_msg,
                    "ai_request": {
                        "prompt": ai_metadata["prompt"],
                        "schema_context": ai_metadata["schema_context"]
                    },
                    "ai_response": {
                        "raw_content": ai_metadata["raw_response"],
                        "model": ai_metadata["model"],
                        "usage": ai_metadata.get("usage", {})
                    }
                })
                
                logger.error(f"Attempt {attempt + 1} failed: {error_msg}")
                
                # 如果还有重试机会，让 AI 修复 SQL
                if attempt < max_retries - 1:
                    logger.info(f"Asking AI to fix SQL error...")
                    sql, ai_metadata = await ai_provider.fix_sql_error(
                        request.natural_query,
                        sql,
                        error_msg,
                        schema_context
                    )
                    logger.info(f"AI generated fixed SQL: {sql}")
        
        # 所有重试都失败，返回详细错误信息
        log_info = {
            "ai_provider": request.ai_provider or settings.ai_provider,
            "natural_query": request.natural_query,
            "timestamp": start_time.strftime("%Y-%m-%d %H:%M:%S"),
            "attempts": attempts,
            "total_attempts": len(attempts),
            "final_status": "failed"
        }
        
        error_detail = {
            "message": f"SQL 执行失败，已尝试 {max_retries} 次",
            "log_info": log_info
        }
        raise HTTPException(status_code=500, detail=error_detail)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**步骤 3：添加 datetime 导入**

在文件顶部添加：`from datetime import datetime`

**步骤 4：提交**

```bash
git add backend/main.py
git c
ommit -m "feat: /query 端点返回完整 log_info"
```

---

## 任务 7：前端更新 QueryResponse 类型

**文件：**
- 修改：`frontend/src/types/query.ts`

**步骤 1：添加 log_info 字段**

```typescript
export interface QueryResponse {
  sql: string
  columns: string[]
  data: any[]
  row_count: number
  log_info: {
    ai_provider: string
    natural_query: string
    timestamp: string
    attempts: Array<{
      attempt: number
      sql: string
      success: boolean
      row_count?: number
      error?: string
      ai_request: {
        prompt: string
        schema_context: string
      }
      ai_response: {
        raw_content: string
        model: string
        usage: object
      }
    }>
    total_attempts: number
    final_status: 'success' | 'failed'
  }
}
```

**步骤 2：提交**

```bash
git add frontend/src/types/query.ts
git commit -m "feat: QueryResponse 添加 log_info 字段"
```

---

## 任务 8：创建 QueryLogCard 组件

**文件：**
- 创建：`frontend/src/components/QueryLogCard.tsx`

**步骤 1：创建卡片组件**

创建完整的日志卡片组件，包含展开/折叠功能。

**步骤 2：提交**

```bash
git add frontend/src/components/QueryLogCard.tsx
git commit -m "feat: 创建查询日志卡片组件"
```

---

## 任务 9：创建 QueryLogDialog 组件

**文件：**
- 创建：`frontend/src/components/QueryLogDialog.tsx`

**步骤 1：创建弹窗组件**

使用 shadcn/ui Dialog，包含筛选器和日志列表。

**步骤 2：提交**

```bash
git add frontend/src/components/QueryLogDialog.tsx
git commit -m "feat: 创建查询日志弹窗组件"
```

---

## 任务 10：创建 Header 组件

**文件：**
- 创建：`frontend/src/components/Header.tsx`

**步骤 1：创建导航栏组件**

包含应用标题、日志按钮（带徽章）、数据库状态。

**步骤 2：提交**

```bash
git add frontend/src/components/Header.tsx
git commit -m "feat: 创建顶部导航栏组件"
```

---

## 任务 11：修改 QueryInput 记录日志

**文件：**
- 修改：`frontend/src/components/QueryInput.tsx`

**步骤 1：导入依赖**

```typescript
import { useLogStore } from '@/stores/logStore'
import { v4 as uuidv4 } from 'uuid'
```

**步骤 2：在 handleSubmit 中记录日志**

查询成功或失败时，解析 log_info 并调用 addLog。

**步骤 3：提交**

```bash
git add frontend/src/components/QueryInput.tsx
git commit -m "feat: QueryInput 集成日志记录"
```

---

## 任务 12：修改 App.tsx 集成组件

**文件：**
- 修改：`frontend/src/App.tsx`

**步骤 1：添加 Header 和 QueryLogDialog**

```typescript
import Header from './components/Header'
import QueryLogDialog from './components/QueryLogDialog'
```

**步骤 2：更新布局**

在页面顶部添加 Header，添加 QueryLogDialog。

**步骤 3：提交**

```bash
git add frontend/src/App.tsx
git commit -m "feat: App 集成 Header 和日志弹窗"
```

---

## 任务 13：手动测试

**测试场景：**

1. **正常查询（无重试）**
   - 执行成功的查询
   - 打开日志弹窗
   - 验证日志显示正确
   - 验证 AI 原始响应可展开

2. **查询失败（有重试）**
   - 构造会失败的查询
   - 验证显示所有重试记录
   - 验证每次尝试的详细信息

3. **筛选功能**
   - 测试状态筛选
   - 测试模型筛选
   - 测试关键词搜索

4. **日志数量限制**
   - 连续执行 25 次查询
   - 验证只保留 20 条

5. **清空日志**
   - 点击清空按钮
   - 验证日志被清空

**步骤：提交测试结果**

```bash
git add .
git commit -m "test: 完成查询日志功能手动测试"
```

---

## 完成

所有任务完成后，查询日志功能已全部实现。

