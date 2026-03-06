export interface ArcGisLayerSummary {
  id: number
  name: string
  type: string
  geometryType?: string
  minScale?: number
  maxScale?: number
}

export interface ArcGisServiceInfo {
  currentVersion?: number
  serviceDescription?: string
  layers: Array<ArcGisLayerSummary>
  tables?: Array<ArcGisLayerSummary>
  spatialReference?: { wkid?: number; latestWkid?: number }
  fullExtent?: {
    xmin: number
    ymin: number
    xmax: number
    ymax: number
    spatialReference?: { wkid?: number }
  }
}

export interface ArcGisField {
  name: string
  type: string
  alias?: string
  sqlType?: string
  length?: number
  nullable?: boolean
  editable?: boolean
  domain?: {
    type: string
    name: string
    codedValues?: Array<{ name: string; code: unknown }>
  } | null
}

export interface ArcGisTypeInfo {
  id: string | number
  name: string
  domains?: Record<
    string,
    | { type: 'codedValue'; codedValues?: Array<{ name: string; code: unknown }> }
    | { type: 'range'; range?: [number, number] }
    | { type: 'inherited' }
  >
}

// ─── Symbol types ────────────────────────────────────────────────────────────

export interface ArcGisSymbolOutline {
  type?: string
  color?: Array<number> // [R, G, B, A]
  width?: number
  style?: string
}

export interface ArcGisSimpleFillSymbol {
  type: 'esriSFS'
  style?: string // esriSFSSolid | esriSFSNull | esriSFSHollow | esriSFSHorizontal | esriSFSVertical | esriSFSForwardDiagonal | esriSFSBackwardDiagonal | esriSFSCross | esriSFSDiagonalCross
  color?: Array<number>
  outline?: ArcGisSymbolOutline
}

export interface ArcGisSimpleLineSymbol {
  type: 'esriSLS'
  style?: string // esriSLSSolid | esriSLSDash | esriSLSDot | esriSLSDashDot | esriSLSDashDotDot | esriSLSNull
  color?: Array<number>
  width?: number
}

export interface ArcGisSimpleMarkerSymbol {
  type: 'esriSMS'
  style?: string // esriSMSCircle | esriSMSSquare | esriSMSDiamond | esriSMSCross | esriSMSX | esriSMSTriangle
  color?: Array<number>
  size?: number
  angle?: number
  xoffset?: number
  yoffset?: number
  outline?: ArcGisSymbolOutline
}

export interface ArcGisPictureMarkerSymbol {
  type: 'esriPMS'
  url?: string
  imageData?: string // base64 encoded
  contentType?: string // e.g. 'image/png'
  color?: Array<number>
  width?: number
  height?: number
  angle?: number
  xoffset?: number
  yoffset?: number
}

export interface ArcGisPictureFillSymbol {
  type: 'esriPFS'
  url?: string
  imageData?: string
  contentType?: string
  color?: Array<number>
  width?: number
  height?: number
  xoffset?: number
  yoffset?: number
  xscale?: number
  yscale?: number
  outline?: ArcGisSymbolOutline
}

export type ArcGisSymbol =
  | ArcGisSimpleFillSymbol
  | ArcGisSimpleLineSymbol
  | ArcGisSimpleMarkerSymbol
  | ArcGisPictureMarkerSymbol
  | ArcGisPictureFillSymbol

// ─── Renderer types ───────────────────────────────────────────────────────────

export interface ArcGisSimpleRenderer {
  type: 'simple'
  symbol: ArcGisSymbol
  label?: string
  description?: string
}

export interface ArcGisUniqueValueInfo {
  value: string
  label?: string
  description?: string
  symbol: ArcGisSymbol
}

export interface ArcGisUniqueValueRenderer {
  type: 'uniqueValue'
  field1?: string
  field2?: string
  field3?: string
  fieldDelimiter?: string
  defaultSymbol?: ArcGisSymbol
  defaultLabel?: string
  uniqueValueInfos: Array<ArcGisUniqueValueInfo>
}

export interface ArcGisClassBreakInfo {
  classMinValue?: number
  classMaxValue: number
  label?: string
  description?: string
  symbol: ArcGisSymbol
}

export interface ArcGisClassBreaksRenderer {
  type: 'classBreaks'
  field?: string
  classificationMethod?: string
  minValue?: number
  defaultSymbol?: ArcGisSymbol
  defaultLabel?: string
  classBreakInfos: Array<ArcGisClassBreakInfo>
}

export type ArcGisRenderer =
  | ArcGisSimpleRenderer
  | ArcGisUniqueValueRenderer
  | ArcGisClassBreaksRenderer

export interface ArcGisDrawingInfo {
  renderer?: ArcGisRenderer
  transparency?: number // 0 (opaque) – 100 (transparent)
  labelingInfo?: Array<unknown>
}

// ─── Layer info ───────────────────────────────────────────────────────────────

export interface ArcGisLayerInfo {
  id: number
  name: string
  type: string
  geometryType?: string
  description?: string
  maxRecordCount?: number
  capabilities?: string
  fields: Array<ArcGisField>
  drawingInfo?: ArcGisDrawingInfo
  typeIdField?: string
  types?: Array<ArcGisTypeInfo>
  extent?: {
    xmin: number
    ymin: number
    xmax: number
    ymax: number
    spatialReference?: { wkid?: number }
  }
  supportsStatistics?: boolean
  supportsOrderBy?: boolean
  advancedQueryCapabilities?: {
    supportsPagination?: boolean
    supportsStatistics?: boolean
    supportsOrderBy?: boolean
    supportsDistinct?: boolean
    supportsSqlExpression?: boolean
  }
}

/** Strip trailing slash and any trailing numeric layer ID from a FeatureServer URL */
export function normalizeFeatureServerUrl(url: string): string {
  return url
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/\d+$/, '')
}

function checkArcGisError(data: unknown): void {
  if (
    data &&
    typeof data === 'object' &&
    'error' in data &&
    data.error &&
    typeof data.error === 'object' &&
    'message' in data.error
  ) {
    throw new Error(String((data.error as Record<string, unknown>).message))
  }
}

export async function fetchFeatureServerInfo(
  url: string,
  token?: string,
): Promise<ArcGisServiceInfo> {
  const baseUrl = normalizeFeatureServerUrl(url)
  const params = new URLSearchParams({ f: 'json' })
  if (token) params.set('token', token)
  const res = await fetch(`${baseUrl}?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  const data: unknown = await res.json()
  checkArcGisError(data)
  const info = data as ArcGisServiceInfo
  if (!Array.isArray(info.layers)) {
    throw new Error(
      'Response does not appear to be a FeatureServer (no layers array)',
    )
  }
  return info
}

export async function fetchLayerInfo(
  serviceUrl: string,
  layerId: number,
  token?: string,
): Promise<ArcGisLayerInfo> {
  const baseUrl = normalizeFeatureServerUrl(serviceUrl)
  const params = new URLSearchParams({ f: 'json' })
  if (token) params.set('token', token)
  const res = await fetch(`${baseUrl}/${layerId}?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  const data: unknown = await res.json()
  checkArcGisError(data)
  return data as ArcGisLayerInfo
}

/**
 * Fetch distinct values for a field from an ArcGIS FeatureServer layer.
 * Uses returnDistinctValues on the /query endpoint.
 * Returns sorted unique values (strings or numbers).
 */
export async function fetchDistinctValues(
  layerUrl: string,
  fieldName: string,
  token?: string,
  maxValues = 500,
): Promise<Array<string | number>> {
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    returnDistinctValues: 'true',
    returnGeometry: 'false',
    outFields: fieldName,
    orderByFields: fieldName,
    resultRecordCount: String(maxValues),
  })
  if (token) params.set('token', token)

  const res = await fetch(`${layerUrl}/query?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  const data = (await res.json()) as {
    features?: Array<{ attributes: Record<string, unknown> }>
    error?: { message: string }
  }
  checkArcGisError(data)

  if (!data.features?.length) return []

  return data.features
    .map((f) => f.attributes[fieldName])
    .filter((v): v is string | number => v != null && v !== '')
}
