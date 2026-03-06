import { X } from 'lucide-react'
import { ValueInput } from './value-input'
import type {
  DataType,
  FilterCondition as FilterConditionType, FilterableField 
} from '@/map-engine/types/filter.types'
import {
  OPERATORS_BY_TYPE,
  getOperatorsForField,
} from '@/map-engine/types/filter.types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface FilterConditionRowProps {
  condition: FilterConditionType
  fields: Array<FilterableField>
  onChange: (condition: FilterConditionType) => void
  onRemove: () => void
}

export function FilterConditionRow({
  condition,
  fields,
  onChange,
  onRemove,
}: FilterConditionRowProps) {
  const fieldDef = fields.find((f) => f.name === condition.field)
  const dataType: DataType = fieldDef?.dataType ?? 'string'
  const operators = fieldDef
    ? getOperatorsForField(fieldDef)
    : OPERATORS_BY_TYPE[dataType]
  const opInfo =
    operators.find((o) => o.op === condition.operator) ?? operators[0]

  return (
    <div className="flex items-start gap-1.5">
      {/* Field selector */}
      <Select
        value={condition.field}
        onValueChange={(fieldName) => {
          if (!fieldName) return
          const newField = fields.find((f) => f.name === fieldName)
          const newOps = newField
            ? getOperatorsForField(newField)
            : OPERATORS_BY_TYPE.string
          onChange({
            ...condition,
            field: fieldName,
            operator: newOps[0].op,
            value: null,
          })
        }}
      >
        <SelectTrigger className="h-7 min-w-[120px] max-w-[180px] text-xs">
          <SelectValue placeholder="Field..." />
        </SelectTrigger>
        <SelectContent>
          {fields.map((f) => (
            <SelectItem key={f.name} value={f.name}>
              <span className="truncate">{f.alias}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator selector */}
      <Select
        value={condition.operator}
        onValueChange={(op) => {
          if (!op) return
          const newOpInfo = operators.find((o) => o.op === op) ?? operators[0]
          onChange({
            ...condition,
            operator: newOpInfo.op,
            // Clear value if switching to a no-value operator
            value: newOpInfo.takesValue ? condition.value : null,
          })
        }}
      >
        <SelectTrigger className="h-7 min-w-[90px] max-w-[130px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operators.map((o) => (
            <SelectItem key={o.op} value={o.op}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value input */}
      {fieldDef && (
        <ValueInput
          field={fieldDef}
          opInfo={opInfo}
          value={condition.value}
          onChange={(value) => onChange({ ...condition, value })}
        />
      )}

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={onRemove}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
