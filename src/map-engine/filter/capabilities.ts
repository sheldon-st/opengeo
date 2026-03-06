import type {
  ArcGisDrawingInfo,
  ArcGisField,
  ArcGisTypeInfo,
  ArcGisUniqueValueRenderer,
} from '@/lib/arcgis-rest'
import type { CodedValue, DataType, FilterableField } from '../types/filter.types'
import type { LayerDefinition } from '../types/layer.types'

// ─── ArcGIS esriFieldType → DataType ─────────────────────────────────────────

const ESRI_TYPE_MAP: Record<string, DataType> = {
  esriFieldTypeString: 'string',
  esriFieldTypeGUID: 'string',
  esriFieldTypeGlobalID: 'string',
  esriFieldTypeXML: 'string',
  esriFieldTypeInteger: 'number',
  esriFieldTypeSmallInteger: 'number',
  esriFieldTypeDouble: 'number',
  esriFieldTypeSingle: 'number',
  esriFieldTypeOID: 'number',
  esriFieldTypeDate: 'datetime',
}

/** Field types that cannot meaningfully be filtered by the user. */
const SKIP_TYPES = new Set([
  'esriFieldTypeGeometry',
  'esriFieldTypeBlob',
  'esriFieldTypeRaster',
  'esriFieldTypeShape',
])

// ─── Value extraction from metadata ──────────────────────────────────────────

/**
 * Extract known values for the `typeIdField` from the `types` array.
 * Each type entry has `id` (the field value) and `name` (human-readable label).
 */
function extractValuesFromTypes(
  types: Array<ArcGisTypeInfo>,
): Array<CodedValue> {
  return types.map((t) => ({
    name: String(t.name),
    code: t.id as string | number,
  }))
}

/**
 * Extract known values from a uniqueValue renderer for a given field.
 * The renderer's `field1` (and optionally field2/field3) defines which field
 * the `uniqueValueInfos` apply to.
 */
function extractValuesFromRenderer(
  drawingInfo: ArcGisDrawingInfo,
  fieldName: string,
): Array<CodedValue> | null {
  const renderer = drawingInfo.renderer
  if (!renderer || renderer.type !== 'uniqueValue') return null

  const uvRenderer = renderer as ArcGisUniqueValueRenderer
  // Only extract if this field matches the renderer's field1
  // (field2/field3 with delimiters create composite keys — skip those)
  if (uvRenderer.field1 !== fieldName) return null
  if (uvRenderer.field2) return null

  if (!uvRenderer.uniqueValueInfos?.length) return null

  return uvRenderer.uniqueValueInfos.map((uvi) => ({
    name: uvi.label ?? String(uvi.value),
    code: uvi.value as string | number,
  }))
}

// ─── Field conversion ────────────────────────────────────────────────────────

function arcgisFieldToFilterable(
  field: ArcGisField,
  typeIdField: string | null,
  types: Array<ArcGisTypeInfo> | null,
  drawingInfo: ArcGisDrawingInfo | null,
): FilterableField | null {
  if (SKIP_TYPES.has(field.type)) return null
  const dataType = ESRI_TYPE_MAP[field.type] ?? 'string'

  const result: FilterableField = {
    name: field.name,
    alias: field.alias && field.alias !== field.name ? field.alias : field.name,
    dataType,
    nullable: field.nullable ?? true,
  }

  // Priority 1: Field-level coded-value domain (most authoritative)
  if (
    field.domain?.type === 'codedValue' &&
    field.domain.codedValues?.length
  ) {
    result.domain = {
      codedValues: field.domain.codedValues.map((cv) => ({
        name: String(cv.name),
        code: cv.code as string | number,
      })),
    }
    return result
  }

  // Priority 2: Range domain
  if (field.domain?.type === 'range') {
    const rd = field.domain as unknown as {
      range?: { minValue: number; maxValue: number }
    }
    if (rd.range) {
      result.domain = { range: [rd.range.minValue, rd.range.maxValue] }
      return result
    }
  }

  // Priority 3: typeIdField — use the `types` array for known values
  if (typeIdField && field.name === typeIdField && types?.length) {
    result.domain = { codedValues: extractValuesFromTypes(types) }
    return result
  }

  // Priority 4: uniqueValue renderer — use uniqueValueInfos for known values
  if (drawingInfo) {
    const rendererValues = extractValuesFromRenderer(drawingInfo, field.name)
    if (rendererValues?.length) {
      result.domain = { codedValues: rendererValues }
      return result
    }
  }

  return result
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Layer kinds that support attribute filtering. */
const FILTERABLE_KINDS = new Set(['arcgis-featureserver', 'wfs'])

/**
 * Extract the available filterable fields for a layer, based on the metadata
 * stored at import time. Returns an empty array for unsupported layer kinds.
 *
 * Known values are extracted from (in priority order):
 * 1. Field-level coded-value domains
 * 2. Field-level range domains
 * 3. `types` array (for the `typeIdField`)
 * 4. `drawingInfo.renderer.uniqueValueInfos` (for uniqueValue renderers)
 */
export function extractFilterableFields(
  layer: LayerDefinition,
): Array<FilterableField> {
  if (layer.kind === 'arcgis-featureserver') {
    const arcgisFields = layer.metadata?.arcgisFields as
      | Array<ArcGisField>
      | undefined
    if (!arcgisFields?.length) return []

    const typeIdField =
      (layer.metadata?.arcgisTypeIdField as string | undefined) ?? null
    const types =
      (layer.metadata?.arcgisTypes as Array<ArcGisTypeInfo> | undefined) ?? null
    const drawingInfo =
      (layer.metadata?.arcgisDrawingInfo as ArcGisDrawingInfo | undefined) ??
      null

    return arcgisFields
      .map((f) => arcgisFieldToFilterable(f, typeIdField, types, drawingInfo))
      .filter((f): f is FilterableField => f !== null)
  }

  // WFS: future — populate from DescribeFeatureType response in metadata
  // if (layer.kind === 'wfs') { ... }

  return []
}

/** Returns true if the layer kind supports structured filtering. */
export function supportsFiltering(layer: LayerDefinition): boolean {
  return FILTERABLE_KINDS.has(layer.kind)
}
