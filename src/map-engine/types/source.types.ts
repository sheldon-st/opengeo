export interface WmsSourceConfig {
  url: string
  layers: string
  format?: string
  version?: string
  crs?: string
  transparent?: boolean
  tiled?: boolean
  extraParams?: Record<string, string>
}

export interface WfsSourceConfig {
  url: string
  typeName: string
  version?: string
  outputFormat?: string
  maxFeatures?: number
  crs?: string
  filter?: string
  bbox?: [number, number, number, number]
}

export interface ArcGisMapServerSourceConfig {
  url: string
  layers?: string
  format?: string
  dynamicLayers?: string
  token?: string
}

export interface ArcGisFeatureServerSourceConfig {
  url: string
  where?: string
  outFields?: Array<string>
  token?: string
  maxRecordCount?: number
}

export interface GeoJsonSourceConfig {
  data?: Record<string, unknown>
  url?: string
}

export interface XyzTileSourceConfig {
  url: string
  minZoom?: number
  maxZoom?: number
  tileSize?: number
  attributions?: string
}

export interface VectorTileSourceConfig {
  url: string
  format?: 'mvt' | 'geojson' | 'topojson'
  minZoom?: number
  maxZoom?: number
  attributions?: string
}

export interface WmtsSourceConfig {
  url: string
  layer: string
  matrixSet: string
  format?: string
  style?: string
  version?: string
}

export interface WcsSourceConfig {
  url: string
  coverageId: string
  version?: string
  format?: string
  crs?: string
  bbox?: [number, number, number, number]
}

export interface StacSourceConfig {
  /** URL to a STAC entity (Item, Collection, or Catalog). */
  url: string
  /** Asset key(s) to render. null = default asset, [] = no assets. */
  assets?: Array<string> | null
  /** One-based band indices to display. */
  bands?: Array<number>
  /** Show the footprint/bounding box geometry. Default: true. */
  displayFootprint?: boolean
  /** Show COG/GeoTIFF overview imagery. Default: true. */
  displayOverview?: boolean
  /** Show preview thumbnails (PNG/JPEG). Default: false. */
  displayPreview?: boolean
  /** Allow non-COG GeoTIFFs as default imagery. Default: false. */
  displayGeoTiffByDefault?: boolean
}

export type SourceConfig =
  | WmsSourceConfig
  | WfsSourceConfig
  | ArcGisMapServerSourceConfig
  | ArcGisFeatureServerSourceConfig
  | GeoJsonSourceConfig
  | XyzTileSourceConfig
  | VectorTileSourceConfig
  | WmtsSourceConfig
  | WcsSourceConfig
  | StacSourceConfig
