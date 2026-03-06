import { useCallback } from 'react'
import type {
  FilterValue,
  FilterableField,
  OperatorInfo,
} from '@/map-engine/types/filter.types'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ValueInputProps {
  field: FilterableField
  opInfo: OperatorInfo
  value: FilterValue
  onChange: (value: FilterValue) => void
}

export function ValueInput({
  field,
  opInfo,
  value,
  onChange,
}: ValueInputProps) {
  if (!opInfo.takesValue) return null

  const hasCoded = !!field.domain?.codedValues?.length

  // ── Coded-value domain: single select ─────────────────────────────────────
  if (hasCoded && opInfo.valueKind === 'single') {
    return (
      <Select
        value={value != null ? String(value) : undefined}
        onValueChange={(v) => {
          if (v == null) return
          const coded = field.domain!.codedValues!.find(
            (cv) => String(cv.code) === v,
          )
          onChange(coded ? coded.code : v)
        }}
      >
        <SelectTrigger className="h-7 min-w-[120px] text-xs">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {field.domain!.codedValues!.map((cv) => (
            <SelectItem key={String(cv.code)} value={String(cv.code)}>
              {cv.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // ── Coded-value domain: multi-select chips for in/not_in ──────────────────
  if (hasCoded && opInfo.valueKind === 'list') {
    return (
      <ChipMultiSelect
        items={field.domain!.codedValues!.map((cv) => ({
          value: cv.code,
          label: cv.name,
        }))}
        value={value}
        onChange={onChange}
      />
    )
  }

  // ── Between: two side-by-side inputs ──────────────────────────────────────
  if (opInfo.valueKind === 'between') {
    const arr = Array.isArray(value) ? value : ['', '']
    const lo = arr[0] ?? ''
    const hi = arr[1] ?? ''
    const inputType = getInputType(field.dataType)

    return (
      <div className="flex items-center gap-1">
        <Input
          type={inputType}
          className="h-7 min-w-[80px] text-xs"
          defaultValue={lo}
          placeholder="Min"
          onBlur={(e) => onChange([coerce(e.target.value, field), hi])}
        />
        <span className="text-[10px] text-muted-foreground">to</span>
        <Input
          type={inputType}
          className="h-7 min-w-[80px] text-xs"
          defaultValue={hi}
          placeholder="Max"
          onBlur={(e) => onChange([lo, coerce(e.target.value, field)])}
        />
      </div>
    )
  }

  // ── List fallback: comma-separated text input ─────────────────────────────
  if (opInfo.valueKind === 'list') {
    const display = Array.isArray(value) ? value.join(', ') : (value ?? '')
    return (
      <Input
        type="text"
        className="h-7 min-w-[120px] text-xs"
        defaultValue={String(display)}
        placeholder="value1, value2, ..."
        onBlur={(e) => {
          const parts = e.target.value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
          const coerced =
            field.dataType === 'number'
              ? parts.map(Number).filter((n) => !isNaN(n))
              : parts
          onChange(coerced)
        }}
      />
    )
  }

  // ── Single-value scalar inputs by data type ───────────────────────────────
  switch (field.dataType) {
    case 'number':
      return (
        <Input
          type="number"
          className="h-7 min-w-[80px] text-xs"
          defaultValue={value != null ? String(value) : ''}
          min={field.domain?.range?.[0]}
          max={field.domain?.range?.[1]}
          onBlur={(e) => {
            const n = Number(e.target.value)
            onChange(isNaN(n) ? null : n)
          }}
        />
      )
    case 'date':
      return (
        <Input
          type="date"
          className="h-7 min-w-[120px] text-xs"
          defaultValue={value != null ? String(value) : ''}
          onBlur={(e) => onChange(e.target.value || null)}
        />
      )
    case 'datetime':
      return (
        <Input
          type="datetime-local"
          className="h-7 min-w-[140px] text-xs"
          defaultValue={value != null ? String(value) : ''}
          onBlur={(e) => onChange(e.target.value || null)}
        />
      )
    default:
      return (
        <Input
          type="text"
          className="h-7 min-w-[120px] text-xs"
          defaultValue={value != null ? String(value) : ''}
          placeholder="Value"
          onBlur={(e) => onChange(e.target.value || null)}
        />
      )
  }
}

// ─── Shared sub-components ──────────────────────────────────────────────────

/** Toggle-chip multi-select for coded values. */
function ChipMultiSelect({
  items,
  value,
  onChange,
}: {
  items: Array<{ value: string | number; label: string }>
  value: FilterValue
  onChange: (v: FilterValue) => void
}) {
  const selected = Array.isArray(value) ? value : []

  const toggle = useCallback(
    (code: string | number) => {
      const next = selected.includes(code)
        ? selected.filter((c) => c !== code)
        : [...selected, code]
      onChange(next)
    },
    [selected, onChange],
  )

  const displayItems = items.slice(0, 100)

  return (
    <div className="flex flex-wrap gap-1 max-w-[240px] max-h-[120px] overflow-y-auto">
      {displayItems.map((item) => {
        const isActive = selected.includes(item.value)
        return (
          <button
            key={String(item.value)}
            type="button"
            className={`rounded-md border px-1.5 py-0.5 text-[10px] transition-colors ${
              isActive
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => toggle(item.value)}
          >
            {item.label}
          </button>
        )
      })}
      {items.length > 100 && (
        <span className="text-[10px] text-muted-foreground px-1">
          +{items.length - 100} more
        </span>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInputType(
  dataType: string,
): 'number' | 'date' | 'datetime-local' | 'text' {
  switch (dataType) {
    case 'number':
      return 'number'
    case 'date':
      return 'date'
    case 'datetime':
      return 'datetime-local'
    default:
      return 'text'
  }
}

function coerce(v: string, field: FilterableField): string | number {
  if (field.dataType === 'number') {
    const n = Number(v)
    return isNaN(n) ? v : n
  }
  return v
}
