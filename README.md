# SQL Bot Mini

自然语言转SQL查询工具 - 使用AI将自然语言转换为SQL查询并可视化结果

## 功能特性

- 🤖 支持多种AI提供商（OpenAI、Anthropic Claude、DeepSeek）
- 🗄️ 支持多种数据库（PostgreSQL、MySQL、SQLite）
- 📊 自动生成图表可视化
- 🌐 现代化的 Web 界面（TypeScript + shadcn/ui）
- ⚡ 快速响应的异步架构
- 🎨 精美的 UI 设计（Tailwind CSS）

## 技术栈

### 后端
- FastAPI - 现代Python Web框架
- SQLAlchemy - 数据库ORM
- httpx - 异步HTTP客户端

### 前端
- React 18 + TypeScript - UI框架
- Vite - 构建工具
- Tailwind CSS - 样式框架
- shadcn/ui - 组件库
- axios - HTTP 客户端
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
pnpm install  # 或 npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填入你的配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，至少需要配置一个AI提供商的API密钥：

```env
# 推荐使用 DeepSeek（性价比高）
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your-key-here
```

或使用 OpenAI：

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

或使用 Anthropic Claude：

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

后端将运行在 http://localhost:8001

#### 启动前端
```bash
cd frontend
pnpm dev  # 或 npm run dev
```

前端将运行在 http://localhost:5174

### 4. 使用

1. 打开浏览器访问 http://localhost:5174
2. 应用会自动连接到 .env 中配置的默认数据库
3. 选择 AI 模型（OpenAI/Anthropic/DeepSeek）
4. 输入自然语言查询，例如："显示所有用户的数量"
5. 查看生成的SQL和可视化结果

**注意：** 数据库配置在后端 `.env` 文件中设置，前端会自动连接。

## API文档

启动后端后，访问 http://localhost:8001/docs 查看完整的API文档

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
- **DeepSeek**: DeepSeek Chat

在 `.env` 文件中配置：

```env
AI_PROVIDER=deepseek  # 推荐，或 openai, anthropic
DEEPSEEK_API_KEY=your_key
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
```

用户也可以在前端界面动态选择使用哪个 AI 模型。

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
│   ├── config.py         # 配置管理（Pydantic Settings）
│   ├── ai_provider.py    # AI集成（OpenAI/Anthropic/DeepSeek）
│   ├── db_manager.py     # 数据库管理（SQLAlchemy）
│   ├── test/             # 测试文件
│   └── requirements.txt  # Python依赖
├── frontend/
│   ├── src/
│   │   ├── App.tsx                      # 主应用组件
│   │   ├── main.tsx                     # 入口文件
│   │   ├── api/                         # API调用封装
│   │   ├── components/                  # React组件
│   │   │   ├── DatabaseConfig.tsx      # 数据库配置
│   │   │   ├── QueryInput.tsx          # 查询输入
│   │   │   ├── ChartDisplay.tsx        # 图表显示
│   │   │   └── ...
│   │   ├── stores/                      # Zustand状态管理
│   │   ├── types/                       # TypeScript类型定义
│   │   └── utils/                       # 工具函数
│   ├── package.json      # Node依赖
│   ├── tsconfig.json     # TypeScript配置
│   ├── tailwind.config.js # Tailwind CSS配置
│   └── vite.config.js    # Vite配置
├── .env.example          # 环境变量模板
├── AGENTS.md             # AI编码助手指南
└── README.md             # 项目文档
```

## 开发

### 后端开发

```bash
cd backend
# 使用uvicorn启动开发服务器（自动重载，端口8001）
uvicorn main:app --reload --port 8001
```

### 前端开发

```bash
cd frontend
pnpm dev  # 或 npm run dev
```

### 运行测试

```bash
# 后端测试
cd backend
python test/test.py

# 或使用 pytest（如果配置）
pytest test/
```

## 注意事项

- 确保AI API密钥有足够的配额
- 数据库查询结果默认限制为100行
- 生成的SQL会自动添加LIMIT子句以防止大量数据返回
- 建议在生产环境中添加SQL注入防护和用户认证
- 后端运行在 **8001 端口**，前端运行在 **5174 端口**
- 推荐使用 DeepSeek API（性价比高，效果好）

## TODO

- [ ] 完善查询日志功能
- [ ] 增加数据库迁移支持
- [ ] 优化前端图表显示
- [ ] 测试数据连表查询功能

## License

MIT
