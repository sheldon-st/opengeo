import { isFilterGroup } from '../../types/filter.types'
import type {
  FilterCondition,
  FilterExpression,
  FilterGroup,
} from '../../types/filter.types'

function esc(v: string): string {
  return v.replace(/'/g, "''")
}

function quoteStr(v: string): string {
  return `'${esc(v)}'`
}

function fmtValue(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return `TIMESTAMP('${v}')`
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `DATE('${v}')`
    return quoteStr(v)
  }
  return String(v)
}

function fmtList(arr: Array<string | number>): string {
  return `(${arr.map((v) => (typeof v === 'string' ? quoteStr(v) : String(v))).join(', ')})`
}

function compileCondition(cond: FilterCondition): string {
  const { field, operator, value } = cond

  switch (operator) {
    case 'eq':
      return `${field} = ${fmtValue(value)}`
    case 'neq':
      return `${field} <> ${fmtValue(value)}`
    case 'gt':
      return `${field} > ${fmtValue(value)}`
    case 'gte':
      return `${field} >= ${fmtValue(value)}`
    case 'lt':
      return `${field} < ${fmtValue(value)}`
    case 'lte':
      return `${field} <= ${fmtValue(value)}`
    case 'contains':
      return `${field} LIKE '%${esc(String(value))}%'`
    case 'not_contains':
      return `${field} NOT LIKE '%${esc(String(value))}%'`
    case 'starts_with':
      return `${field} LIKE '${esc(String(value))}%'`
    case 'ends_with':
      return `${field} LIKE '%${esc(String(value))}'`
    case 'is_null':
      return `${field} IS NULL`
    case 'is_not_null':
      return `${field} IS NOT NULL`
    case 'is_true':
      return `${field} = TRUE`
    case 'is_false':
      return `${field} = FALSE`
    case 'before':
      return `${field} < ${fmtValue(value)}`
    case 'after':
      return `${field} > ${fmtValue(value)}`
    case 'on_or_before':
      return `${field} <= ${fmtValue(value)}`
    case 'on_or_after':
      return `${field} >= ${fmtValue(value)}`
    case 'between': {
      if (!Array.isArray(value) || value.length < 2) return '1=1'
      return `${field} BETWEEN ${fmtValue(value[0])} AND ${fmtValue(value[1])}`
    }
    case 'in': {
      if (!Array.isArray(value) || value.length === 0) return '1=1'
      return `${field} IN ${fmtList(value)}`
    }
    case 'not_in': {
      if (!Array.isArray(value) || value.length === 0) return '1=1'
      return `${field} NOT IN ${fmtList(value)}`
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
 * Compile a FilterExpression to an OGC CQL string.
 * Returns '1=1' for empty expressions.
 */
export function compileToCql(expr: FilterExpression): string {
  const result = compileExpr(expr)
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
