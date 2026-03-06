// ─── Data types ───────────────────────────────────────────────────────────────

export type DataType = 'string' | 'number' | 'date' | 'datetime' | 'boolean'

// ─── Operators ────────────────────────────────────────────────────────────────

export type StringOp =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null'

export type NumberOp =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null'

export type DateOp =
  | 'eq'
  | 'neq'
  | 'before'
  | 'after'
  | 'on_or_before'
  | 'on_or_after'
  | 'between'
  | 'is_null'
  | 'is_not_null'

export type BooleanOp = 'is_true' | 'is_false' | 'is_null' | 'is_not_null'

export type ComparisonOp = StringOp | NumberOp | DateOp | BooleanOp

// ─── Values ───────────────────────────────────────────────────────────────────

/** Scalar values are JSON-safe primitives. Ranges use a two-element tuple. */
export type FilterValue = string | number | boolean | null | Array<string | number> // for 'between' [lo, hi] or 'in' [v1, v2, ...]

// ─── Expression tree ─────────────────────────────────────────────────────────

export interface FilterCondition {
  kind: 'condition'
  field: string
  operator: ComparisonOp
  value: FilterValue
}

export interface FilterGroup {
  kind: 'group'
  operator: 'and' | 'or'
  children: Array<FilterExpression>
}

export type FilterExpression = FilterCondition | FilterGroup

// ─── Filterable field descriptor ─────────────────────────────────────────────

export interface CodedValue {
  name: string
  code: string | number
}

export interface FilterableField {
  name: string
  alias: string
  dataType: DataType
  nullable: boolean
  domain?: {
    codedValues?: Array<CodedValue>
    range?: [number, number]
  }
}

// ─── Type guards ─────────────────────────────────────────────────────────────

export function isFilterGroup(expr: FilterExpression): expr is FilterGroup {
  return expr.kind === 'group'
}

export function isFilterCondition(
  expr: FilterExpression,
): expr is FilterCondition {
  return expr.kind === 'condition'
}

// ─── Operator metadata ────────────────────────────────────────────────────────

export interface OperatorInfo {
  op: ComparisonOp
  label: string
  /** false for is_null, is_not_null, is_true, is_false */
  takesValue: boolean
  /** true for 'between' — expects [min, max] tuple */
  valueKind: 'single' | 'between' | 'list' | 'none'
}

export const OPERATORS_BY_TYPE: Record<DataType, Array<OperatorInfo>> = {
  string: [
    { op: 'eq', label: '=', takesValue: true, valueKind: 'single' },
    { op: 'neq', label: '≠', takesValue: true, valueKind: 'single' },
    {
      op: 'contains',
      label: 'contains',
      takesValue: true,
      valueKind: 'single',
    },
    {
      op: 'not_contains',
      label: 'not contains',
      takesValue: true,
      valueKind: 'single',
    },
    {
      op: 'starts_with',
      label: 'starts with',
      takesValue: true,
      valueKind: 'single',
    },
    {
      op: 'ends_with',
      label: 'ends with',
      takesValue: true,
      valueKind: 'single',
    },
    { op: 'in', label: 'in', takesValue: true, valueKind: 'list' },
    { op: 'not_in', label: 'not in', takesValue: true, valueKind: 'list' },
    { op: 'is_null', label: 'is blank', takesValue: false, valueKind: 'none' },
    {
      op: 'is_not_null',
      label: 'is not blank',
      takesValue: false,
      valueKind: 'none',
    },
  ],
  number: [
    { op: 'eq', label: '=', takesValue: true, valueKind: 'single' },
    { op: 'neq', label: '≠', takesValue: true, valueKind: 'single' },
    { op: 'gt', label: '>', takesValue: true, valueKind: 'single' },
    { op: 'gte', label: '≥', takesValue: true, valueKind: 'single' },
    { op: 'lt', label: '<', takesValue: true, valueKind: 'single' },
    { op: 'lte', label: '≤', takesValue: true, valueKind: 'single' },
    { op: 'between', label: 'between', takesValue: true, valueKind: 'between' },
    { op: 'in', label: 'in', takesValue: true, valueKind: 'list' },
    { op: 'not_in', label: 'not in', takesValue: true, valueKind: 'list' },
    { op: 'is_null', label: 'is null', takesValue: false, valueKind: 'none' },
    {
      op: 'is_not_null',
      label: 'is not null',
      takesValue: false,
      valueKind: 'none',
    },
  ],
  date: [
    { op: 'eq', label: 'on', takesValue: true, valueKind: 'single' },
    { op: 'neq', label: 'not on', takesValue: true, valueKind: 'single' },
    { op: 'before', label: 'before', takesValue: true, valueKind: 'single' },
    { op: 'after', label: 'after', takesValue: true, valueKind: 'single' },
    {
      op: 'on_or_before',
      label: 'on or before',
      takesValue: true,
      valueKind: 'single',
    },
    {
      op: 'on_or_after',
      label: 'on or after',
      takesValue: true,
      valueKind: 'single',
    },
    { op: 'between', label: 'between', takesValue: true, valueKind: 'between' },
    { op: 'is_null', label: 'is null', takesValue: false, valueKind: 'none' },
    {
      op: 'is_not_null',
      label: 'is not null',
      takesValue: false,
      valueKind: 'none',
    },
  ],
  datetime: [
    { op: 'eq', label: 'at', takesValue: true, valueKind: 'single' },
    { op: 'neq', label: 'not at', takesValue: true, valueKind: 'single' },
    { op: 'before', label: 'before', takesValue: true, valueKind: 'single' },
    { op: 'after', label: 'after', takesValue: true, valueKind: 'single' },
    {
      op: 'on_or_before',
      label: 'on or before',
      takesValue: true,
      valueKind: 'single',
    },
    {
      op: 'on_or_after',
      label: 'on or after',
      takesValue: true,
      valueKind: 'single',
    },
    { op: 'between', label: 'between', takesValue: true, valueKind: 'between' },
    { op: 'is_null', label: 'is null', takesValue: false, valueKind: 'none' },
    {
      op: 'is_not_null',
      label: 'is not null',
      takesValue: false,
      valueKind: 'none',
    },
  ],
  boolean: [
    { op: 'is_true', label: 'is true', takesValue: false, valueKind: 'none' },
    { op: 'is_false', label: 'is false', takesValue: false, valueKind: 'none' },
    { op: 'is_null', label: 'is null', takesValue: false, valueKind: 'none' },
    {
      op: 'is_not_null',
      label: 'is not null',
      takesValue: false,
      valueKind: 'none',
    },
  ],
}

/**
 * Get the appropriate operators for a field, accounting for domain constraints.
 * Fields with coded-value domains get a focused set (eq, neq, in, not_in, null checks).
 * Fields with range domains keep their full operator set.
 */
export function getOperatorsForField(field: FilterableField): Array<OperatorInfo> {
  const baseOps = OPERATORS_BY_TYPE[field.dataType]

  if (field.domain?.codedValues?.length) {
    // Coded-value fields: only equality and set membership make sense
    const codedOps: Array<ComparisonOp> = [
      'eq',
      'neq',
      'in',
      'not_in',
      'is_null',
      'is_not_null',
    ]
    return baseOps.filter((o) => codedOps.includes(o.op))
  }

  return baseOps
}

// ─── Factory helpers ──────────────────────────────────────────────────────────

export function createCondition(
  field: string,
  operator: ComparisonOp,
  value: FilterValue = null,
): FilterCondition {
  return { kind: 'condition', field, operator, value }
}

export function createGroup(
  operator: 'and' | 'or' = 'and',
  children: Array<FilterExpression> = [],
): FilterGroup {
  return { kind: 'group', operator, children }
}

export function createEmptyFilter(): FilterGroup {
  return createGroup('and', [])
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Count all conditions recursively in a filter expression. */
export function countConditions(expr: FilterExpression): number {
  if (isFilterCondition(expr)) return 1
  return expr.children.reduce((sum, child) => sum + countConditions(child), 0)
}
