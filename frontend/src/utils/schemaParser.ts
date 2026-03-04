import type { TableSchema } from '@/types'

export function parseSchemaText(schemaText: string): TableSchema[] {
  const tables: TableSchema[] = []
  const blocks = schemaText
    .split(/\n\s*\n/g)
    .map((b) => b.trim())
    .filter(Boolean)

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trimEnd())
    const header = lines[0]?.trim()
    if (!header?.startsWith('Table: ')) continue

    const tableName = header.replace('Table: ', '').trim()
    const columns = lines
      .slice(1)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const firstSpace = line.indexOf(' ')
        const name = firstSpace === -1 ? line : line.slice(0, firstSpace).trim()
        const rest = firstSpace === -1 ? '' : line.slice(firstSpace + 1).trim()

        let nullable = true
        let typePart = rest

        if (rest.toUpperCase().endsWith('NOT NULL')) {
          nullable = false
          typePart = rest.slice(0, -'NOT NULL'.length).trim()
        } else if (rest.toUpperCase().endsWith('NULL')) {
          nullable = true
          typePart = rest.slice(0, -'NULL'.length).trim()
        }

        return {
          name,
          type: typePart,
          nullable
        }
      })

    tables.push({
      name: tableName,
      columns
    })
  }

  return tables
}
