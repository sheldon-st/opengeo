import { useMemo } from 'react'
import { Filter, Trash2 } from 'lucide-react'
import { FilterGroupComponent } from './filter-group'
import type { FilterExpression } from '@/map-engine/types/filter.types'
import type { LayerDefinition } from '@/map-engine/types/layer.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { compileFilter, extractFilterableFields  } from '@/map-engine/filter'
import {
  countConditions,
  createEmptyFilter,
  createGroup,
  isFilterGroup,
} from '@/map-engine/types/filter.types'

interface FilterEditorProps {
  layer: LayerDefinition
  onChange: (filter: FilterExpression | undefined) => void
}

export function FilterEditor({ layer, onChange }: FilterEditorProps) {
  const fields = useMemo(
    () => extractFilterableFields(layer),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layer.id, layer.metadata],
  )

  if (fields.length === 0) {
    return (
      <div className="grid gap-2 text-center py-8">
        <Filter className="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">
          No filterable fields available for this layer.
        </p>
      </div>
    )
  }

  const filter = layer.filter
  const conditionCount = filter ? countConditions(filter) : 0

  // Ensure the filter is a group at the top level
  const filterGroup =
    filter && isFilterGroup(filter)
      ? filter
      : filter
        ? createGroup('and', [filter])
        : undefined

  // Preview the compiled output
  const compiled = filter ? compileFilter(layer) : undefined

  return (
    <div className="grid gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">
            Attribute Filter
          </span>
          {conditionCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {conditionCount}{' '}
              {conditionCount === 1 ? 'condition' : 'conditions'}
            </Badge>
          )}
        </div>
        {filter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[11px] text-destructive hover:text-destructive"
            onClick={() => onChange(undefined)}
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Empty state */}
      {!filterGroup && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => onChange(createEmptyFilter())}
        >
          <Filter className="h-3.5 w-3.5" />
          Add Filter
        </Button>
      )}

      {/* Filter tree */}
      {filterGroup && (
        <FilterGroupComponent
          group={filterGroup}
          fields={fields}
          depth={0}
          onChange={(g) => onChange(g)}
        />
      )}

      {/* Compiled preview */}
      {compiled && compiled !== '1=1' && (
        <>
          <Separator />
          <div className="grid gap-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Compiled Query
            </span>
            <pre className="rounded-md bg-muted px-2 py-1.5 text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-all">
              {compiled}
            </pre>
          </div>
        </>
      )}
    </div>
  )
}
