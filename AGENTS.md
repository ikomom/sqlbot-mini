# SQL Bot Mini - Agent Guidelines

这是一个自然语言转 SQL 查询工具，使用 FastAPI (后端) + React + TypeScript (前端)。

## 项目结构

```
sqlbot-mini/
├── backend/          # Python FastAPI 后端
│   ├── main.py       # API 端点定义
│   ├── config.py     # 配置管理（Pydantic Settings）
│   ├── ai_provider.py # AI 集成（OpenAI/Anthropic/DeepSeek）
│   ├── db_manager.py # 数据库管理（SQLAlchemy）
│   └── test/         # 测试文件
└── frontend/         # React + TypeScript + Vite 前端
    └── src/
        ├── App.tsx
        ├── api/      # API 调用封装
        ├── components/
        ├── stores/   # Zustand 状态管理
        └── types/    # TypeScript 类型定义
```

## 构建和运行命令

### 后端

```bash
# 安装依赖
cd backend
pip install -r requirements.txt

# 启动开发服务器（端口 8001）
python main.py

# 或使用 uvicorn（支持热重载）
uvicorn main:app --reload --port 8001

# 运行单个测试文件
python test/test.py

# 运行所有测试（如果使用 pytest）
pytest test/

# 运行特定测试
pytest test/test.py::test_function_name
```

### 前端

```bash
# 安装依赖
cd frontend
pnpm install  # 或 npm install

# 启动开发服务器（端口 5174）
pnpm dev

# 生产构建
pnpm build

# 预览生产构建
pnpm preview
```

### 环境配置

复制 `.env.example` 到 `.env` 并配置必需的环境变量：

```bash
cp .env.example .env
```

必需的环境变量：
- `OPENAI_API_KEY`、`ANTHROPIC_API_KEY` 或 `DEEPSEEK_API_KEY`：AI 服务密钥
- `AI_PROVIDER`：选择 "openai"、"anthropic" 或 "deepseek"

## 代码风格指南

### 通用规范

- **语言**: 所有注释、文档字符串、UI 文本使用**简体中文**
- **缩进**: Python 使用 4 空格，TypeScript 使用 2 空格
- **行长度**: Python 最大 100 字符，TypeScript 最大 120 字符
- **文件编码**: UTF-8，换行符使用 LF（\n）

### Python 后端代码风格

#### 导入规范

按以下顺序分组，组间空一行：
1. 标准库（`from typing import Dict, Any, Optional`）
2. 第三方库（`from fastapi import FastAPI, HTTPException`）
3. 本地模块（`from config import settings`）

#### 类型提示

**必须**使用类型提示，包括函数参数、返回值和变量：

```python
def connect(self, db_config: Dict[str, Any]) -> None:
    """连接数据库"""
    self.engine: Optional[Engine] = create_engine(conn_str)
```

#### 命名约定

- **类名**: PascalCase (`DatabaseConfig`, `AIProvider`)
- **函数/变量**: snake_case (`connect_database`, `natural_query`)
- **常量**: UPPER_SNAKE_CASE (`DEFAULT_DB_TYPE`)
- **私有方法**: 前缀下划线 (`_build_prompt`)

#### 错误处理

- API 端点使用 `HTTPException`，提供清晰的中文错误信息
- 内部方法使用 `ValueError` 或 `RuntimeError`

#### 异步编程

- API 端点使用 `async def`
- 外部 API 调用使用 `httpx.AsyncClient`
- 数据库操作可以是同步的（SQLAlchemy 默认）

#### 文档字符串

使用简洁的中文文档字符串（单行即可）：

```python
def get_schema_context(self) -> str:
    """获取数据库结构信息用于 AI 上下文"""
```

#### Pydantic 模型

使用 Pydantic 进行数据验证，字段使用类型提示和默认值。

### React 前端代码风格

#### 导入规范

按以下顺序分组：
1. React 核心（`import { useState, useEffect } from 'react'`）
2. 第三方库（`import axios from 'axios'`）
3. 本地模块（使用 `@/` 别名，如 `import DatabaseConfig from '@/components/DatabaseConfig'`）
4. 类型导入（`import type { QueryResponse } from '@/types'`）

#### 组件结构

使用**函数组件 + Hooks + TypeScript**：

```typescript
interface QueryInputProps {
  onQueryResult: (result: QueryResponse) => void
}

export default function QueryInput({ onQueryResult }: QueryInputProps) {
  const [query, setQuery] = useState<string>('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // 处理逻辑
  }
  
  return <div className="bg-white p-5 rounded-lg">{/* JSX */}</div>
}
```

#### 命名约定

- **组件**: PascalCase (`DatabaseConfig`, `QueryInput`)
- **函数/变量**: camelCase (`handleSubmit`, `queryResult`)
- **常量**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **类型/接口**: PascalCase (`QueryResponse`, `DatabaseConfig`)
- **类型文件**: 使用 `.ts` 扩展名，放在 `types/` 目录

#### TypeScript 类型定义

**必须**为所有组件 props、状态和函数定义类型。类型定义放在 `types/` 目录。

#### 样式

使用 **Tailwind CSS** 类名，避免内联样式对象（除非动态计算）。

#### 错误处理

使用 try-catch 捕获错误，提供清晰的中文错误信息：

```typescript
try {
  const response = await fetch('/api/query', { /* ... */ })
  if (!response.ok) throw new Error(data.detail || '查询失败')
  const result: QueryResponse = await response.json()
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : '未知错误'
  setError(errorMessage)
}
```

## API 端点

- `POST /database/connect` - 连接数据库
- `GET /database/status` - 检查连接状态
- `GET /database/schema` - 获取数据库结构
- `POST /query` - 执行自然语言查询

## 注意事项

- 后端运行在 **8001 端口**，前端运行在 **5174 端口**
- 前端 API 请求地址：`http://localhost:8001`
- 确保 `.env` 文件配置了有效的 AI API 密钥
- 数据库查询结果默认限制为 100 行
