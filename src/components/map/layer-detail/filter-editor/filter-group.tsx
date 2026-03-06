import { FolderPlus, Plus, X } from 'lucide-react'
import { FilterConditionRow } from './filter-condition'
import type {
  FilterExpression,
  FilterGroup as FilterGroupType,
  FilterableField,
} from '@/map-engine/types/filter.types'
import {
  createCondition,
  createGroup,
  getOperatorsForField,
  isFilterGroup,
} from '@/map-engine/types/filter.types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MAX_DEPTH = 3

interface FilterGroupProps {
  group: FilterGroupType
  fields: Array<FilterableField>
  depth: number
  onChange: (group: FilterGroupType) => void
  onRemove?: () => void
}

export function FilterGroupComponent({
  group,
  fields,
  depth,
  onChange,
  onRemove,
}: FilterGroupProps) {
  const updateChild = (i: number, next: FilterExpression) => {
    const children = [...group.children]
    children[i] = next
    onChange({ ...group, children })
  }

  const removeChild = (i: number) => {
    onChange({
      ...group,
      children: group.children.filter((_, idx) => idx !== i),
    })
  }

  const addCondition = () => {
    const firstField = fields[0]
    if (!firstField) return
    const ops = getOperatorsForField(firstField)
    onChange({
      ...group,
      children: [
        ...group.children,
        createCondition(firstField.name, ops[0].op),
      ],
    })
  }

  const addGroup = () => {
    onChange({
      ...group,
      children: [...group.children, createGroup('and', [])],
    })
  }

  const toggleOperator = () => {
    onChange({
      ...group,
      operator: group.operator === 'and' ? 'or' : 'and',
    })
  }

  return (
    <div
      className={cn(
        'grid gap-2',
        depth > 0 && 'border-l-2 border-border pl-3 ml-1',
      )}
    >
      {/* Group header */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-[11px] font-semibold uppercase"
          onClick={toggleOperator}
        >
          {group.operator}
        </Button>
        <span className="text-[10px] text-muted-foreground">
          {group.operator === 'and'
            ? 'All conditions must match'
            : 'Any condition must match'}
        </span>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-6 w-6"
            onClick={onRemove}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Children */}
      {group.children.map((child, i) =>
        isFilterGroup(child) ? (
          <FilterGroupComponent
            key={i}
            group={child}
            fields={fields}
            depth={depth + 1}
            onChange={(g) => updateChild(i, g)}
            onRemove={() => removeChild(i)}
          />
        ) : (
          <FilterConditionRow
            key={i}
            condition={child}
            fields={fields}
            onChange={(c) => updateChild(i, c)}
            onRemove={() => removeChild(i)}
          />
        ),
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-[11px]"
          onClick={addCondition}
          disabled={fields.length === 0}
        >
          <Plus className="h-3 w-3" />
          Condition
        </Button>
        {depth < MAX_DEPTH && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[11px]"
            onClick={addGroup}
          >
            <FolderPlus className="h-3 w-3" />
            Group
          </Button>
        )}
      </div>
    </div>
  )
}
