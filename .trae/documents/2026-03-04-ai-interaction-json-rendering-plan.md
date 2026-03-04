# 计划：AI 交互请求/响应 JSON 展示优化（支持纯 JSON / 美化显示）

## 目标

* 在「查询日志」里的 AI 交互区域（请求/响应）支持两种展示方式：

  * **纯 JSON**：严格 JSON 字符串展示（保留 `\\n` 等转义），便于复制粘贴到其他工具。

  * **美化展示**：更易读的结构化展示；当某些字段值包含转义换行（`\\n`）时，以更直观的多行形式呈现。

## 当前现状（基于代码阅读）

* [QueryLogCard.tsx](file:///d:/Project/private/ai/sqlbot-mini/frontend/src/components/QueryLogCard.tsx) 中 AI 交互用 `<pre>` 渲染：

  * `typeof log.aiRequest === 'string' ? log.aiRequest : JSON.stringify(log.aiRequest, null, 2)`

  * 响应同理

* 问题点：

  * 当字段值里包含 `\\n`，在 JSON.stringify 后依旧是 `\\n`，阅读体验差。

  * 当 `aiRequest/aiResponse` 为字符串且“看起来像 JSON”，目前不会尝试解析与结构化展示。

  * 缺少“复制纯 JSON”的明确入口。

## 设计原则

* 不引入新依赖（避免额外包体与安装成本）。

* 组件化：把 JSON/文本渲染逻辑抽成可复用组件或工具函数，避免 QueryLogCard 过度膨胀。

* 安全与稳定：

  * 解析失败要优雅降级到原始文本。

  * 大对象展示要有高度限制与滚动（避免撑爆卡片）。

## 方案概述

### 1) 统一规范化数据（Normalize）

新增一个小的工具函数（例如 `normalizeAiPayload(payload)`），输出以下结构：

* `kind: 'json' | 'text'`

* `rawText: string`（始终可用于“纯 JSON/原文复制”）

* `jsonValue?: unknown`（当成功解析为 JSON 时提供）

Normalize 规则（按优先级）：

1. `payload` 是对象/数组：`kind='json'`，`jsonValue=payload`，`rawText=JSON.stringify(payload, null, 2)`
2. `payload` 是字符串：

   * 先 `trim()`，如果以 `{`/`[` 开头，尝试 `JSON.parse`：

     * 成功：`kind='json'`，`jsonValue=parsed`，`rawText=pretty JSON`

     * 失败：`kind='text'`，`rawText=payload`

   * 其他情况：`kind='text'`，`rawText=payload`
3. 其他类型：转成文本展示

### 2) 两种展示模式（View Mode）

- 模式 A：**美化**

* 模式 A：**美化**
- 模式 B：**原始（纯 JSON/原文）**
  - 永远用 `<pre>` 展示 `rawText`（不做 unescape），并提供“一键复制”按钮

### 3) JsonPrettyView（核心）

实现一个无依赖的递归渲染器，能力：

* 对象/数组折叠（可选：默认展开 2 层；超出层级显示可展开按钮）

* 基础 token 着色（key、string、number、boolean、null）

* **字符串值可读化**：

  * 检测是否包含字面量 `\\n` / `\\t` 等：在“美化”模式下显示为真实换行/缩进

  * 但仍保持“这是字符串”的视觉提示（例如包裹引号，或在多行块中显示）

* 最大高度限制（沿用现有 `max-h-40`，可调整为 `max-h-64` 等）

### 4) 交互与可用性
- 仅在 **AI 交互区域处于“显示”状态**时（即用户点了“显示”展开后），才展示控制按钮，避免卡片默认状态过于拥挤。
- 在 AI 交互展开区域提供 2 个按钮：
  - “美化/原始”切换（原始 = 纯 JSON/原文）
  - “复制”（复制 `rawText`，保证可复制出严格 JSON 或原文；美化模式下也复制 `rawText`，避免复制到非 JSON 的视觉格式）
  * “美化/纯 JSON”切换

## 需要修改/新增的文件（执行阶段）

* 修改：

  * `frontend/src/components/QueryLogCard.tsx`：接入新渲染组件与模式切换、复制按钮

* 新增（择一组织方式）：

  * A. `frontend/src/components/JsonPrettyView.tsx` + `frontend/src/components/TextPrettyView.tsx`

  * B. `frontend/src/components/log/AiPayloadView.tsx`（把 AI 交互区域整体抽组件）

* 新增工具函数：

  * `frontend/src/utils/aiPayload.ts`（normalize + unescape helpers）

## 验收标准

* 当 `aiRequest/aiResponse` 为对象时：

  * 美化模式：结构化、可读、字符串里的 `\\n` 以多行显示

  * 纯 JSON：严格 JSON 字符串（`\\n` 保留），可直接复制粘贴

* 当 `aiRequest/aiResponse` 为 JSON 字符串时：

  * 自动识别并在美化模式结构化展示

* 当 `aiRequest/aiResponse` 为普通字符串时：

  * 美化模式可把 `\\n` 变成真实换行阅读

  * 纯 JSON/原文模式保持原样

* 解析失败不报错：回退到文本展示

## 验证方式

* 前端本地启动后，打开 Query Log，展开任意带 AI 交互的记录：

  * 构造一个包含 `\\n` 的字段（例如 prompt/schema\_context）观察两种模式差异

  * 点击“复制”后粘贴到文本编辑器，确认内容符合预期
