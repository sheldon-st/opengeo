import { useState } from 'react'
import { PlusIcon, Trash2Icon, ServerIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useDataSourceStore, type DataSource } from '@/lib/data-sources'

function deriveLabelFromUrl(url: string): string {
  const cleaned = url.replace(/\/+$/, '')
  try {
    const parsed = new URL(cleaned)
    return parsed.hostname
  } catch {
    return cleaned.split('/').pop() ?? 'Data Source'
  }
}

interface SourceListProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

export function SourceList({ selectedId, onSelect }: SourceListProps) {
  const sources = useDataSourceStore((s) => s.sources)
  const add = useDataSourceStore((s) => s.add)
  const remove = useDataSourceStore((s) => s.remove)

  const [showForm, setShowForm] = useState(false)
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')

  const handleAdd = () => {
    const trimmed = url.trim()
    if (!trimmed) return

    const source: DataSource = {
      id: crypto.randomUUID(),
      type: 'arcgis',
      label: deriveLabelFromUrl(trimmed),
      url: trimmed.replace(/\/+$/, ''),
      createdAt: Date.now(),
      token: token.trim() || undefined,
    }

    add(source)
    onSelect(source.id)
    setUrl('')
    setToken('')
    setShowForm(false)
  }

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    remove(id)
    if (selectedId === id) {
      onSelect(sources.find((s) => s.id !== id)?.id ?? '')
    }
  }

  return (
    <div className="flex h-full flex-col gap-2  ">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">Data Sources</h3>
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0"
          onClick={() => setShowForm((v) => !v)}
        >
          <PlusIcon className="size-3.5" />
        </Button>
      </div>

      {showForm && (
        <div className="grid gap-2 rounded-md border p-2">
          <div className="grid gap-1">
            <label className="text-[10px] font-medium text-muted-foreground">
              ArcGIS REST URL
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…/arcgis/rest/services"
              className="text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-[10px] font-medium text-muted-foreground">
              Token (optional)
            </label>
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Access token"
              className="text-xs"
            />
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              className="flex-1 text-xs"
              onClick={handleAdd}
              disabled={!url.trim()}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="grid gap-0.5">
          {sources.map((source) => (
            <button
              key={source.id}
              type="button"
              onClick={() => onSelect(source.id)}
              className={cn(
                'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted',
                selectedId === source.id && 'bg-muted',
              )}
            >
              <ServerIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{source.label}</div>
                <div className="truncate text-[10px] text-muted-foreground">
                  {source.url}
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 text-[9px]">
                {source.type === 'arcgis' ? 'ArcGIS' : source.type}
              </Badge>
              <button
                type="button"
                onClick={(e) => handleRemove(e, source.id)}
                className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <Trash2Icon className="size-3" />
              </button>
            </button>
          ))}
          {sources.length === 0 && !showForm && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No data sources added yet.
              <br />
              Click + to add one.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
