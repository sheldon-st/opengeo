import { isFilterGroup } from '../../types/filter.types'
import type {
  FilterCondition,
  FilterExpression,
  FilterGroup,
} from '../../types/filter.types'

/** Escape single quotes for SQL strings. */
function esc(v: string): string {
  return v.replace(/'/g, "''")
}

function quoteStr(v: string): string {
  return `'${esc(v)}'`
}

/** ArcGIS date literal: date 'YYYY-MM-DD' */
function fmtDate(iso: string): string {
  return `date '${iso.slice(0, 10)}'`
}

/** ArcGIS timestamp literal: timestamp 'YYYY-MM-DD HH:mm:ss' */
function fmtTimestamp(iso: string): string {
  return `timestamp '${iso
    .replace('T', ' ')
    .replace('Z', '')
    .replace(/\.\d+$/, '')}'`
}

function fmtValue(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? '1' : '0'
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return fmtTimestamp(v)
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return fmtDate(v)
    return quoteStr(v)
  }
  return String(v)
}

function fmtList(arr: Array<string | number>): string {
  return `(${arr.map((v) => (typeof v === 'string' ? quoteStr(v) : String(v))).join(', ')})`
}

function compileCondition(cond: FilterCondition): string {
  const { field, operator, value } = cond
  const col = field

  switch (operator) {
    case 'eq':
      return `${col} = ${fmtValue(value)}`
    case 'neq':
      return `${col} <> ${fmtValue(value)}`
    case 'gt':
      return `${col} > ${fmtValue(value)}`
    case 'gte':
      return `${col} >= ${fmtValue(value)}`
    case 'lt':
      return `${col} < ${fmtValue(value)}`
    case 'lte':
      return `${col} <= ${fmtValue(value)}`
    case 'contains':
      return `${col} LIKE '%${esc(String(value))}%'`
    case 'not_contains':
      return `${col} NOT LIKE '%${esc(String(value))}%'`
    case 'starts_with':
      return `${col} LIKE '${esc(String(value))}%'`
    case 'ends_with':
      return `${col} LIKE '%${esc(String(value))}'`
    case 'is_null':
      return `${col} IS NULL`
    case 'is_not_null':
      return `${col} IS NOT NULL`
    case 'is_true':
      return `${col} = 1`
    case 'is_false':
      return `${col} = 0`
    case 'before':
      return `${col} < ${fmtValue(value)}`
    case 'after':
      return `${col} > ${fmtValue(value)}`
    case 'on_or_before':
      return `${col} <= ${fmtValue(value)}`
    case 'on_or_after':
      return `${col} >= ${fmtValue(value)}`
    case 'between': {
      if (!Array.isArray(value) || value.length < 2) return '1=1'
      return `${col} BETWEEN ${fmtValue(value[0])} AND ${fmtValue(value[1])}`
    }
    case 'in': {
      if (!Array.isArray(value) || value.length === 0) return '1=1'
      return `${col} IN ${fmtList(value)}`
    }
    case 'not_in': {
      if (!Array.isArray(value) || value.length === 0) return '1=1'
      return `${col} NOT IN ${fmtList(value)}`
    }
    default:
      return '1=1'
  }
}

function compileGroup(group: FilterGroup): string {
  if (!group.children.length) return '1=1'
  const parts = group.children.map(compileExpr)
  if (parts.length === 1) return parts[0]
  const joiner = group.operator === 'and' ? ' AND ' : ' OR '
  return `(${parts.join(joiner)})`
}

function compileExpr(expr: FilterExpression): string {
  return isFilterGroup(expr) ? compileGroup(expr) : compileCondition(expr)
}

/**
 * Compile a FilterExpression to an ArcGIS SQL WHERE clause string.
 * Returns '1=1' for empty expressions.
 */
export function compileToArcGisWhere(expr: FilterExpression): string {
  const result = compileExpr(expr)
  // Strip wrapping parens from top-level group for cleaner output
  if (
    isFilterGroup(expr) &&
    expr.children.length > 1 &&
    result.startsWith('(') &&
    result.endsWith(')')
  ) {
    return result.slice(1, -1)
  }
  return result
}
