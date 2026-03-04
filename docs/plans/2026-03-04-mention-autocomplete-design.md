# @ 命令自动补全功能设计文档

**日期**: 2026-03-04  
**作者**: AI Assistant  
**状态**: 已批准

## 1. 概述

为查询输入框添加 @ 命令自动补全功能，允许用户通过 `@表名.字段名` 的方式快速引用数据库表和字段，提升输入效率和准确性。

## 2. 功能需求

### 2.1 核心功能
- 输入 `@` 触发表名自动补全
- 选择表名后输入 `.` 触发该表的字段名补全
- 实时过滤：继续输入字符时过滤补全列表
- 高亮显示：选中的表名和字段名在输入框中高亮显示
- 键盘导航：支持上下箭头选择、Enter 确认、Esc 取消

### 2.2 用户体验
- 补全菜单显示详细信息：
  - 表名：显示表名 + 字段数量 + 图标
  - 字段名：显示字段名 + 类型 + 图标
- 高亮样式：蓝色半透明背景 + 蓝色文字
- 流畅的交互：无明显延迟，响应迅速

## 3. 技术方案

### 3.1 实现方式
**方案选择**: 纯前端实现 + 现有 API

**理由**:
- 利用现有 `/database/schema` API，无需修改后端
- 响应速度快，无网络延迟
- 实现难度适中，易于维护
- 与现有技术栈无缝集成

### 3.2 组件架构

```
QueryInput (现有组件)
  └── MentionTextarea (新增：带 @ 提及功能的文本框)
        ├── Textarea (shadcn/ui 组件)
        ├── MentionDropdown (新增：自动补全下拉菜单)
        │     ├── MentionList (新增：补全项列表)
        │     └── MentionItem (新增：单个补全项)
        └── HighlightOverlay (新增：高亮显示层)
```

### 3.3 组件职责

#### MentionTextarea
- **职责**: 协调输入、补全、高亮的主控制器
- **状态管理**:
  - 输入文本内容
  - 光标位置
  - 当前触发的补全类型（表名/字段名）
  - 补全菜单的显示/隐藏状态
- **接口**:
  ```typescript
  interface MentionTextareaProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    tables: TableSchema[]
    className?: string
  }
  ```

#### MentionDropdown
- **职责**: 管理补全菜单的显示位置和交互
- **功能**:
  - 根据光标位置计算菜单坐标
  - 处理键盘导航（上下箭头、Enter、Esc）
  - 过滤和搜索补全项
- **接口**:
  ```typescript
  interface MentionDropdownProps {
    visible: boolean
    position: { top: number; left: number }
    items: MentionItem[]
    onSelect: (item: MentionItem) => void
    onClose: () => void
    filterText: string
  }
  ```

#### MentionList
- **职责**: 渲染补全项列表，管理选中状态
- **功能**:
  - 渲染补全项
  - 高亮匹配的文本
  - 键盘选中状态管理

#### MentionItem
- **职责**: 渲染单个补全项
- **显示内容**:
  - 表名：表名 + 字段数量 + 图标
  - 字段名：字段名 + 类型 + 图标
- **接口**:
  ```typescript
  interface MentionItemProps {
    type: 'table' | 'column'
    name: string
    meta?: string
    icon?: string
    isSelected: boolean
    onClick: () => void
  }
  ```

#### HighlightOverlay
- **职责**: 在文本框上方叠加高亮层
- **实现方式**:
  - 使用绝对定位的 div，与 Textarea 完全重叠
  - 解析文本中的 `@表名.字段名` 模式
  - 渲染带样式的 HTML，其他文本透明
  - Textarea 设置透明文字，只显示光标

### 3.4 数据结构

```typescript
// types/mention.ts

export interface TableSchema {
  name: string
  columns: ColumnSchema[]
}

export interface ColumnSchema {
  name: string
  type: string
  nullable: boolean
}

export interface MentionItem {
  type: 'table' | 'column'
  tableName: string
  columnName?: string
  displayName: string
  meta: string
  icon: string
}

export interface MentionContext {
  type: 'table' | 'column'
  triggerChar: '@' | '.'
  triggerPosition: number
  filterText: string
  tableName?: string
}
```

### 3.5 核心逻辑

#### 输入检测
```typescript
function handleInput(e: ChangeEvent<HTMLTextAreaElement>) {
  const text = e.target.value
  const cursorPos = e.target.selectionStart
  
  // 检测 @ 触发表名补全
  if (text[cursorPos - 1] === '@') {
    showMentionDropdown({
      type: 'table',
      triggerChar: '@',
      triggerPosition: cursorPos,
      filterText: ''
    })
  }
  
  // 检测 . 触发字段名补全
  if (text[cursorPos - 1] === '.') {
    const tableName = extractTableNameBeforeCursor(text, cursorPos)
    if (tableName) {
      showMentionDropdown({
        type: 'column',
        triggerChar: '.',
        triggerPosition: cursorPos,
        filterText: '',
        tableName
      })
    }
  }
  
  // 更新过滤文本
  if (mentionContext) {
    const filterText = extractFilterText(text, mentionContext.triggerPosition, cursorPos)
    updateFilterText(filterText)
  }
}
```

#### Schema 解析
```typescript
function parseSchemaText(schemaText: string): TableSchema[] {
  const tables: TableSchema[] = []
  const lines = schemaText.split('\n')
  let currentTable: TableSchema | null = null
  
  for (const line of lines) {
    if (line.startsWith('Table: ')) {
      if (currentTable) tables.push(currentTable)
      currentTable = {
        name: line.replace('Table: ', '').trim(),
        columns: []
      }
    } else if (line.trim() && currentTable) {
      const [name, type, nullable] = line.trim().split(/\s+/)
      currentTable.columns.push({ name, type, nullable: nullable === 'NULL' })
    }
  }
  
  if (currentTable) tables.push(currentTable)
  return tables
}
```

#### 高亮渲染
```typescript
function renderHighlightedText(text: string): ReactNode {
  const mentionRegex = /@(\w+)(?:\.(\w+))?/g
  const parts = []
  let lastIndex = 0
  let match
  
  while ((match = mentionRegex.exec(text)) !== null) {
    parts.push(<span className="text-transparent">{text.slice(lastIndex, match.index)}</span>)
    parts.push(<span className="mention-highlight">{match[0]}</span>)
    lastIndex = match.index + match[0].length
  }
  
  parts.push(<span className="text-transparent">{text.slice(lastIndex)}</span>)
  return parts
}
```

### 3.6 自定义 Hooks

#### useSchemaData
- **职责**: 获取和缓存数据库 schema
- **返回**: `{ tables, loading, error, refetch }`

#### useMentionDetection
- **职责**: 检测 @ 和 . 触发，管理补全上下文
- **返回**: `{ mentionContext, updateContext, clearContext }`

#### useMentionFilter
- **职责**: 根据输入文本过滤补全项
- **返回**: `{ filteredItems }`

#### useKeyboardNavigation
- **职责**: 处理补全菜单的键盘导航
- **返回**: `{ selectedIndex, handleKeyDown }`

## 4. 数据流

### 4.1 Schema 数据获取
```
组件挂载
  ↓
useSchemaData Hook 调用 /database/schema API
  ↓
解析 schema 文本 → 转换为 TableSchema[]
  ↓
存储到组件状态
  ↓
传递给 MentionTextarea
```

### 4.2 用户交互流程
```
用户输入 "@"
  ↓
MentionTextarea 检测到触发字符
  ↓
创建 MentionContext { type: 'table', ... }
  ↓
显示 MentionDropdown，传入所有表名
  ↓
用户继续输入 "use"
  ↓
MentionDropdown 过滤显示包含 "use" 的表
  ↓
用户按 Enter 或点击选择 "users"
  ↓
MentionTextarea 在光标位置插入 "users"
  ↓
HighlightOverlay 渲染高亮效果
  ↓
用户输入 "."
  ↓
检测到 "." 且前面有表名 "users"
  ↓
显示 MentionDropdown，传入 users 表的字段
  ↓
用户选择 "name"
  ↓
插入 "name"，最终文本为 "@users.name"
```

## 5. 错误处理

### 5.1 Schema 加载失败
- 显示友好的错误提示
- 降级为普通文本框，禁用 @ 补全功能

### 5.2 无效的表名引用
- 用户输入 `@invalid_table.` 时不显示补全菜单
- 可选：显示 "表不存在" 提示

### 5.3 光标位置计算失败
- 使用默认位置或不显示菜单
- 记录错误日志便于调试

## 6. 性能优化

### 6.1 防抖输入
- 过滤文本输入使用 150ms 防抖

### 6.2 Memo 优化
- MentionItem 使用 React.memo 避免不必要的重渲染
- 过滤逻辑使用 useMemo 缓存结果

### 6.3 虚拟滚动（可选）
- 如果表数量超过 100，使用虚拟滚动优化渲染性能

## 7. 样式设计

### 7.1 高亮样式
```css
.mention-highlight {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border-radius: 3px;
  padding: 1px 2px;
  font-weight: 500;
}
```

### 7.2 补全菜单
```css
.mention-dropdown {
  max-height: 300px;
  overflow-y: auto;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 8px;
  backdrop-filter: blur(12px);
}
```

### 7.3 补全项
```css
.mention-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.mention-item:hover,
.mention-item.selected {
  background: rgba(6, 182, 212, 0.1);
}
```

## 8. 测试策略

### 8.1 单元测试
- `schemaParser.ts`: 测试各种 schema 文本格式的解析
- `useMentionDetection`: 测试 @ 和 . 的检测逻辑
- `useMentionFilter`: 测试过滤算法

### 8.2 集成测试
- MentionTextarea: 测试完整的输入 → 补全 → 选择流程
- 测试键盘导航（上下箭头、Enter、Esc）
- 测试边界情况（空表、无字段、特殊字符）

## 9. 文件结构

```
frontend/src/
├── components/
│   ├── QueryInput.tsx (修改)
│   └── mention/
│       ├── MentionTextarea.tsx (新增)
│       ├── MentionDropdown.tsx (新增)
│       ├── MentionList.tsx (新增)
│       ├── MentionItem.tsx (新增)
│       └── HighlightOverlay.tsx (新增)
├── hooks/
│   ├── useSchemaData.ts (新增)
│   ├── useMentionDetection.ts (新增)
│   ├── useMentionFilter.ts (新增)
│   └── useKeyboardNavigation.ts (新增)
├── types/
│   └── mention.ts (新增)
└── utils/
    └── schemaParser.ts (新增)
```

## 10. 实施计划

### 阶段 1: 基础设施
1. 创建类型定义 (`types/mention.ts`)
2. 实现 Schema 解析工具 (`utils/schemaParser.ts`)
3. 实现 `useSchemaData` Hook

### 阶段 2: 核心组件
4. 实现 `MentionItem` 组件
5. 实现 `MentionList` 组件
6. 实现 `MentionDropdown` 组件

### 阶段 3: 输入检测
7. 实现 `useMentionDetection` Hook
8. 实现 `useMentionFilter` Hook
9. 实现 `useKeyboardNavigation` Hook

### 阶段 4: 主组件集成
10. 实现 `HighlightOverlay` 组件
11. 实现 `MentionTextarea` 组件
12. 集成到 `QueryInput` 组件

### 阶段 5: 测试和优化
13. 编写单元测试
14. 编写集成测试
15. 性能优化和样式调整

## 11. 验收标准

- [ ] 输入 `@` 能正确显示所有表名
- [ ] 输入 `@user` 能过滤显示包含 "user" 的表名
- [ ] 选择表名后输入 `.` 能显示该表的字段列表
- [ ] 选中的表名和字段名在输入框中高亮显示
- [ ] 支持键盘导航（上下箭头、Enter、Esc）
- [ ] Schema 加载失败时能优雅降级
- [ ] 无明显性能问题，响应流畅
- [ ] 样式与现有 UI 风格一致

## 12. 未来扩展

- 支持多表联合查询的智能提示
- 支持字段别名的补全
- 支持 SQL 函数的补全
- 支持历史查询的补全
