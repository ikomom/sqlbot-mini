# SQL Bot Mini

自然语言转SQL查询工具 - 使用AI将自然语言转换为SQL查询并可视化结果

## 功能特性

- 🤖 支持多种AI提供商（OpenAI、Anthropic Claude）
- 🗄️ 支持多种数据库（PostgreSQL、MySQL、SQLite）
- 📊 自动生成图表可视化
- 🌐 简洁的Web界面
- ⚡ 快速响应的异步架构

## 技术栈

### 后端
- FastAPI - 现代Python Web框架
- SQLAlchemy - 数据库ORM
- httpx - 异步HTTP客户端

### 前端
- React 18 - UI框架
- Vite - 构建工具
- Recharts - 图表库

## 快速开始

### 1. 安装依赖

#### 后端
```bash
cd backend
pip install -r requirements.txt
```

#### 前端
```bash
cd frontend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填入你的配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，至少需要配置一个AI提供商的API密钥：

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

或使用Anthropic Claude：

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-key-here
```

### 3. 启动服务

#### 启动后端
```bash
cd backend
python main.py
```

后端将运行在 http://localhost:8000

#### 启动前端
```bash
cd frontend
npm run dev
```

前端将运行在 http://localhost:5173

### 4. 使用

1. 打开浏览器访问 http://localhost:5173
2. 配置数据库连接信息
3. 输入自然语言查询，例如："显示所有用户的数量"
4. 查看生成的SQL和可视化结果

## API文档

启动后端后，访问 http://localhost:8000/docs 查看完整的API文档

### 主要端点

- `POST /api/database/connect` - 连接数据库
- `GET /api/database/status` - 检查连接状态
- `GET /api/database/schema` - 获取数据库结构
- `POST /api/query` - 执行自然语言查询

## 配置说明

### AI提供商

支持以下AI提供商：

- **OpenAI**: GPT-4, GPT-3.5
- **Anthropic**: Claude 3.5 Sonnet

在 `.env` 文件中配置：

```env
AI_PROVIDER=openai  # 或 anthropic
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
```

### 数据库

支持以下数据库：

- PostgreSQL
- MySQL
- SQLite

数据库连接可以在Web界面中配置，也可以在 `.env` 中设置默认值。

## 项目结构

```
sqlbot-mini/
├── backend/
│   ├── main.py           # FastAPI应用入口
│   ├── config.py         # 配置管理
│   ├── ai_provider.py    # AI集成
│   ├── db_manager.py     # 数据库管理
│   └── requirements.txt  # Python依赖
├── frontend/
│   ├── src/
│   │   ├── App.jsx                      # 主应用组件
│   │   ├── components/
│   │   │   ├── DatabaseConfig.jsx      # 数据库配置
│   │   │   ├── QueryInput.jsx          # 查询输入
│   │   │   └── ChartDisplay.jsx        # 图表显示
│   │   └── main.jsx                     # 入口文件
│   ├── package.json      # Node依赖
│   └── vite.config.js    # Vite配置
├── .env.example          # 环境变量模板
└── README.md             # 项目文档
```

## 开发

### 后端开发

```bash
cd backend
# 使用uvicorn启动开发服务器（自动重载）
uvicorn main:app --reload
```

### 前端开发

```bash
cd frontend
npm run dev
```

## 注意事项

- 确保AI API密钥有足够的配额
- 数据库查询结果默认限制为100行
- 生成的SQL会自动添加LIMIT子句以防止大量数据返回
- 建议在生产环境中添加SQL注入防护和用户认证

## License

MIT
