export interface ColumnSchema {
  name: string
  type: string
  nullable: boolean
}

export interface TableSchema {
  name: string
  columns: ColumnSchema[]
}

export type MentionItemType = 'table' | 'column'

export interface MentionItem {
  type: MentionItemType
  tableName: string
  columnName?: string
  displayName: string
  meta: string
  icon: string
}

export interface MentionContext {
  type: MentionItemType
  triggerChar: '@' | '.'
  triggerPosition: number
  filterText: string
  tableName?: string
}
