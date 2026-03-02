# SQL Bot Mini - Agent Guidelines

这是一个自然语言转 SQL 查询工具，使用 FastAPI (后端) + React (前端)。

## 项目结构

```
sqlbot-mini/
├── backend/          # Python FastAPI 后端
│   ├── main.py       # API 端点定义
│   ├── config.py     # 配置管理
│   ├── ai_provider.py # AI 集成
│   └── db_manager.py # 数据库管理
└── frontend/         # React + Vite 前端
    └── src/
        ├── App.jsx
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

# 运行测试（当前测试覆盖率很低）
python test/test.py
```

### 前端

```bash
# 安装依赖
cd frontend
pnpm install  # 或 npm install

# 启动开发服务器（端口 5173）
pnpm dev

# 生产构建
pnpm build

# 预览生产构建
pnpm preview
```

### 环境配置

复制 `.env.example` 到 `.env` 并配置 AI API 密钥：

```bash
cp .env.example .env
```

## 代码风格指南

### 通用规范

- **语言**: 所有注释、文档字符串、UI 文本使用**简体中文**
- **缩进**: Python 使用 4 空格，JavaScript 使用 2 空格
- **行长度**: Python 最大 100 字符，JavaScript 最大 120 字符
- **文件编码**: UTF-8

### Python 后端代码风格

#### 导入规范

```python
# 标准库
from typing import Dict, Any, Optional

# 第三方库
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# 本地模块
from config import settings
from db_manager import db_manager
```

#### 类型提示

**必须**使用类型提示：

```python
async def connect_database(config: DatabaseConfig) -> Dict[str, str]:
    """连接数据库"""
    result: Dict[str, Any] = db_manager.connect(config.dict())
    return result
```

#### 命名约定

- **类名**: PascalCase (`DatabaseConfig`, `AIProvider`)
- **函数/变量**: snake_case (`connect_database`, `current_config`)
- **常量**: UPPER_SNAKE_CASE (`DEFAULT_DB_TYPE`)
- **私有成员**: 前缀下划线 (`_internal_method`)

#### 错误处理

使用 FastAPI 的 `HTTPException`：

```python
try:
    result = db_manager.execute_query(sql)
    return result
except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
```

#### 异步编程

API 端点使用 `async def`：

```python
@app.post("/api/query")
async def execute_query(request: QueryRequest):
    result = await ai_provider.generate_sql(request.natural_query)
    return result
```

#### 文档字符串

使用简洁的中文文档字符串：

```python
async def get_schema():
    """获取数据库结构信息"""
    schema = db_manager.get_schema_context()
    return {"schema": schema}
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
  const response = await fetch('/api/query', {
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

- `POST /api/database/connect` - 连接数据库
- `GET /api/database/status` - 检查连接状态
- `GET /api/database/schema` - 获取数据库结构
- `POST /api/query` - 执行自然语言查询

## 注意事项

- 后端运行在 **8001 端口**（避免与其他服务冲突）
- 前端运行在 **5173 端口**
- 前端 API 请求地址：`http://localhost:8001`
- 确保 `.env` 文件配置了有效的 AI API 密钥
- 数据库查询结果默认限制为 100 行
