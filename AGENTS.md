# SQL Bot Mini - Agent Guidelines

这是一个自然语言转 SQL 查询工具，使用 FastAPI (后端) + React (前端)。

## 项目结构

```
sqlbot-mini/
├── backend/          # Python FastAPI 后端
│   ├── main.py       # API 端点定义
│   ├── config.py     # 配置管理（Pydantic Settings）
│   ├── ai_provider.py # AI 集成（OpenAI/Anthropic）
│   ├── db_manager.py # 数据库管理（SQLAlchemy）
│   └── test/         # 测试文件
└── frontend/         # React + Vite 前端
    └── src/
        ├── App.jsx
        ├── api.js    # API 调用封装
        └── components/
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

# Lint（如果配置了 ESLint）
pnpm lint
```

### 环境配置

复制 `.env.example` 到 `.env` 并配置必需的环境变量：

```bash
cp .env.example .env
```

必需的环境变量：
- `OPENAI_API_KEY` 或 `ANTHROPIC_API_KEY`：AI 服务密钥
- `AI_PROVIDER`：选择 "openai" 或 "anthropic"

## 代码风格指南

### 通用规范

- **语言**: 所有注释、文档字符串、UI 文本使用**简体中文**
- **缩进**: Python 使用 4 空格，JavaScript 使用 2 空格
- **行长度**: Python 最大 100 字符，JavaScript 最大 120 字符
- **文件编码**: UTF-8
- **换行符**: 使用 LF（\n），不使用 CRLF

### Python 后端代码风格

#### 导入规范

按以下顺序分组，组间空一行：

```python
# 1. 标准库
from typing import Dict, Any, Optional

# 2. 第三方库
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, text

# 3. 本地模块
from config import settings
from db_manager import db_manager
```

#### 类型提示

**必须**使用类型提示，包括函数参数、返回值和变量：

```python
def connect(self, db_config: Dict[str, Any]) -> None:
    """连接数据库"""
    self.engine: Optional[Engine] = create_engine(conn_str)
    self.current_config: Optional[Dict] = db_config
```

#### 命名约定

- **类名**: PascalCase (`DatabaseConfig`, `AIProvider`, `QueryRequest`)
- **函数/变量**: snake_case (`connect_database`, `current_config`, `natural_query`)
- **常量**: UPPER_SNAKE_CASE (`DEFAULT_DB_TYPE`, `MAX_QUERY_LIMIT`)
- **私有方法**: 前缀下划线 (`_build_prompt`, `_extract_sql`)

#### 错误处理

- API 端点使用 `HTTPException`
- 内部方法使用 `ValueError` 或 `RuntimeError`
- 始终提供清晰的中文错误信息

```python
# API 端点
@app.post("/query")
async def execute_query(request: QueryRequest):
    try:
        result = db_manager.execute_query(sql)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询执行失败: {str(e)}")

# 内部方法
def connect(self, db_config: Dict[str, Any]) -> None:
    if not self.engine:
        raise ValueError("Database not connected")
```

#### 异步编程

- API 端点使用 `async def`
- 外部 API 调用使用 `httpx.AsyncClient`
- 数据库操作可以是同步的（SQLAlchemy 默认）

```python
@app.post("/query")
async def execute_query(request: QueryRequest):
    ai = AIProvider(request.ai_provider)
    sql = await ai.generate_sql(request.natural_query, schema)
    return db_manager.execute_query(sql)
```

#### 文档字符串

使用简洁的中文文档字符串（单行即可）：

```python
def get_schema_context(self) -> str:
    """获取数据库结构信息用于 AI 上下文"""
    
async def _openai_generate(self, natural_query: str, schema_context: str) -> str:
    """使用 OpenAI API 生成 SQL"""
```

#### Pydantic 模型

使用 Pydantic 进行数据验证：

```python
class DatabaseConfig(BaseModel):
    type: str  # postgresql, mysql, sqlite
    host: str = "localhost"
    port: int = 5432
    database: str
    username: str = ""
    password: str = ""
```

### React 前端代码风格

#### 导入规范

```javascript
// React 核心
import { useState, useEffect } from 'react'

// 第三方库
import axios from 'axios'

// 本地组件
import DatabaseConfig from './components/DatabaseConfig'
```

#### 组件结构

使用**函数组件 + Hooks**：

```javascript
export default function QueryInput({ onQueryResult }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    // 处理逻辑
  }
  
  return (
    <div style={styles.container}>
      {/* JSX */}
    </div>
  )
}
```

#### 命名约定

- **组件**: PascalCase (`DatabaseConfig`, `QueryInput`)
- **函数/变量**: camelCase (`handleSubmit`, `queryResult`)
- **常量**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **样式对象**: camelCase (`styles.container`)

#### 样式

使用**内联样式对象**：

```javascript
const styles = {
  container: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px'
  }
}
```

#### 错误处理

```javascript
try {
  const response = await fetch('/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ natural_query: query })
  })
  
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.detail || '查询失败')
  }
  
  const result = await response.json()
  onQueryResult(result)
} catch (err) {
  setError(err.message)
}
```

## API 端点

- `POST /database/connect` - 连接数据库
- `GET /database/status` - 检查连接状态
- `GET /database/schema` - 获取数据库结构
- `POST /query` - 执行自然语言查询

## 注意事项

- 后端运行在 **8001 端口**（避免与其他服务冲突）
- 前端运行在 **5174 端口**（Vite 配置）
- 前端 API 请求地址：`http://localhost:8001`
- 确保 `.env` 文件配置了有效的 AI API 密钥
- 数据库查询结果默认限制为 100 行

