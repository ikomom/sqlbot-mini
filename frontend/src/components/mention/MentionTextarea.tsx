import { useEffect, useMemo, useRef, useState } from 'react'
import type { TableSchema, MentionContext, MentionItem } from '@/types'
import { Textarea } from '@/components/ui/textarea'

interface MentionTextareaProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
  tables: TableSchema[]
}

const mentionRegex = /@([A-Za-z_][\w]*)(?:\.([A-Za-z_][\w]*))?/g

function getCaretPositionInContainer(
  textarea: HTMLTextAreaElement,
  container: HTMLElement,
  position: number
): { top: number; left: number } {
  const style = window.getComputedStyle(textarea)
  const mirror = document.createElement('div')

  const properties = [
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontSizeAdjust',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing',
    'tabSize',
    'MozTabSize'
  ] as const

  for (const prop of properties) {
    // @ts-expect-error index
    mirror.style[prop] = style[prop]
  }

  mirror.style.position = 'absolute'
  mirror.style.visibility = 'hidden'
  mirror.style.whiteSpace = 'pre-wrap'
  mirror.style.wordWrap = 'break-word'
  mirror.style.top = '0'
  mirror.style.left = '0'

  const before = textarea.value.slice(0, position)
  const after = textarea.value.slice(position)

  const span = document.createElement('span')
  span.textContent = after.length > 0 ? after[0] : '.'

  mirror.textContent = before
  mirror.appendChild(span)
  container.appendChild(mirror)

  const containerRect = container.getBoundingClientRect()
  const spanRect = span.getBoundingClientRect()
  const mirrorRect = mirror.getBoundingClientRect()

  const top = spanRect.top - mirrorRect.top - textarea.scrollTop
  const left = spanRect.left - mirrorRect.left - textarea.scrollLeft

  container.removeChild(mirror)

  return {
    top: Math.max(0, top) + (spanRect.top - mirrorRect.top === 0 ? 0 : 0),
    left: Math.max(0, left) + 0
  }
}

function HighlightOverlay({
  text,
  scrollTop,
  scrollLeft
}: {
  text: string
  scrollTop: number
  scrollLeft: number
}) {
  const parts = useMemo(() => {
    const result: Array<{ key: string; type: 'plain' | 'mention'; text: string }> = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    const input = text || ''
    mentionRegex.lastIndex = 0
    while ((match = mentionRegex.exec(input)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          key: `p-${lastIndex}`,
          type: 'plain',
          text: input.slice(lastIndex, match.index)
        })
      }
      result.push({
        key: `m-${match.index}`,
        type: 'mention',
        text: match[0]
      })
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < input.length) {
      result.push({
        key: `p-${lastIndex}`,
        type: 'plain',
        text: input.slice(lastIndex)
      })
    }
    if (result.length === 0) {
      result.push({ key: 'p-0', type: 'plain', text: '' })
    }
    return result
  }, [text])

  const displayText = text.endsWith('\n') ? text : `${text}\n`

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md">
      <div
        className="px-3 py-2 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-cyan-50"
        style={{
          transform: `translate(${-scrollLeft}px, ${-scrollTop}px)`
        }}
      >
        {parts.map((p) =>
          p.type === 'mention' ? (
            <span key={p.key} className="rounded-sm bg-cyan-400/20 text-cyan-100">
              {p.text}
            </span>
          ) : (
            <span key={p.key}>{p.text}</span>
          )
        )}
        {displayText.length === 0 ? null : null}
      </div>
    </div>
  )
}

function buildItems(context: MentionContext, tables: TableSchema[]): MentionItem[] {
  if (context.type === 'table') {
    return tables.map((t) => ({
      type: 'table',
      tableName: t.name,
      displayName: t.name,
      meta: `${t.columns.length} 列`,
      icon: '▦'
    }))
  }

  const table = tables.find((t) => t.name === context.tableName)
  if (!table) return []
  return table.columns.map((c) => ({
    type: 'column',
    tableName: table.name,
    columnName: c.name,
    displayName: c.name,
    meta: c.type || (c.nullable ? 'NULL' : 'NOT NULL'),
    icon: '⎇'
  }))
}

function filterItems(items: MentionItem[], filterText: string) {
  const q = filterText.trim().toLowerCase()
  if (!q) return items
  return items.filter((i) => i.displayName.toLowerCase().includes(q))
}

export default function MentionTextarea({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
  tables
}: MentionTextareaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [context, setContext] = useState<MentionContext | null>(null)
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const items = useMemo(() => {
    if (!context) return []
    return filterItems(buildItems(context, tables), context.filterText)
  }, [context, tables])

  const updateDropdownPosition = () => {
    const ta = textareaRef.current
    const container = containerRef.current
    if (!ta || !container) return
    const caret = ta.selectionStart ?? 0
    const pos = getCaretPositionInContainer(ta, container, caret)
    const maxLeft = Math.max(8, container.clientWidth - 360)
    setPosition({
      top: Math.min(container.clientHeight - 8, pos.top + 28),
      left: Math.min(maxLeft, pos.left)
    })
  }

  const close = () => {
    setOpen(false)
    setContext(null)
    setSelectedIndex(0)
  }

  const applySelection = (item: MentionItem) => {
    const ta = textareaRef.current
    if (!ta || !context) return
    const cursor = ta.selectionStart ?? context.triggerPosition
    const start = context.triggerPosition
    const insert = item.type === 'table' ? item.tableName : item.columnName || ''
    const nextValue = value.slice(0, start) + insert + value.slice(cursor)
    onChange(nextValue)
    close()
    requestAnimationFrame(() => {
      ta.focus()
      const nextPos = start + insert.length
      ta.setSelectionRange(nextPos, nextPos)
    })
  }

  const handleTextChange = (nextValue: string, cursorPos: number) => {
    onChange(nextValue)

    const lastChar = cursorPos > 0 ? nextValue[cursorPos - 1] : ''
    if (lastChar === '@') {
      const nextContext: MentionContext = {
        type: 'table',
        triggerChar: '@',
        triggerPosition: cursorPos,
        filterText: ''
      }
      setContext(nextContext)
      setOpen(true)
      setSelectedIndex(0)
      requestAnimationFrame(updateDropdownPosition)
      return
    }

    if (lastChar === '.') {
      const before = nextValue.slice(0, cursorPos)
      const match = /@([A-Za-z_][\w]*)\.$/.exec(before)
      const tableName = match?.[1]
      if (tableName && tables.some((t) => t.name === tableName)) {
        const nextContext: MentionContext = {
          type: 'column',
          triggerChar: '.',
          triggerPosition: cursorPos,
          filterText: '',
          tableName
        }
        setContext(nextContext)
        setOpen(true)
        setSelectedIndex(0)
        requestAnimationFrame(updateDropdownPosition)
        return
      }
    }

    if (context) {
      const filterText = nextValue.slice(context.triggerPosition, cursorPos)
      const nextContext = { ...context, filterText }
      setContext(nextContext)
      setOpen(true)
      setSelectedIndex(0)
      requestAnimationFrame(updateDropdownPosition)
      return
    }

    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container) return
      if (!container.contains(e.target as Node)) close()
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    updateDropdownPosition()
  }, [open, items.length])

  return (
    <div ref={containerRef} className="relative">
      <HighlightOverlay text={value} scrollTop={scrollTop} scrollLeft={scrollLeft} />
      <Textarea
        id={id}
        ref={(node) => {
          textareaRef.current = node
        }}
        value={value}
        onChange={(e) => handleTextChange(e.target.value, e.target.selectionStart ?? 0)}
        onKeyDown={(e) => {
          if (!open) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex((i) => Math.min(items.length - 1, i + 1))
            return
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex((i) => Math.max(0, i - 1))
            return
          }
          if (e.key === 'Enter') {
            const item = items[selectedIndex]
            if (item) {
              e.preventDefault()
              applySelection(item)
            }
            return
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            close()
            return
          }
        }}
        onScroll={(e) => {
          const target = e.currentTarget
          setScrollTop(target.scrollTop)
          setScrollLeft(target.scrollLeft)
          if (open) requestAnimationFrame(updateDropdownPosition)
        }}
        placeholder={placeholder}
        rows={rows}
        className={[
          className,
          'relative bg-transparent text-transparent caret-cyan-50',
          'selection:bg-cyan-400/20'
        ]
          .filter(Boolean)
          .join(' ')}
      />

      {open && items.length > 0 && (
        <div
          className="absolute z-50 w-[360px] max-h-72 overflow-auto rounded-md border border-cyan-500/30 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-cyan-500/10"
          style={{ top: position.top, left: position.left }}
        >
          <div className="py-1">
            {items.map((item, idx) => (
              <button
                key={`${item.type}-${item.tableName}-${item.columnName || item.displayName}-${idx}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applySelection(item)}
                className={[
                  'w-full text-left px-3 py-2 flex items-center gap-3',
                  idx === selectedIndex
                    ? 'bg-cyan-500/10 text-cyan-100'
                    : 'text-slate-200 hover:bg-cyan-500/5 hover:text-cyan-100'
                ].join(' ')}
              >
                <span className="w-5 text-center text-cyan-300 font-mono">{item.icon}</span>
                <span className="flex-1 font-mono text-sm truncate">{item.displayName}</span>
                <span className="text-xs font-mono text-slate-400">{item.meta}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
