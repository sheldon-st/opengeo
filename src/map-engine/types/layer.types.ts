import type {
  ArcGisFeatureServerSourceConfig,
  ArcGisMapServerSourceConfig,
  GeoJsonSourceConfig,
  VectorTileSourceConfig,
  WcsSourceConfig,
  WfsSourceConfig,
  WmsSourceConfig,
  WmtsSourceConfig,
  XyzTileSourceConfig,
} from './source.types'
import type { LayerStyleDefinition } from './style.types'

export type LayerKind =
  | 'wms'
  | 'wfs'
  | 'arcgis-mapserver'
  | 'arcgis-featureserver'
  | 'geojson'
  | 'xyz-tile'
  | 'vector-tile'
  | 'wmts'
  | 'wcs'
  | 'group'

export interface LayerBase {
  id: string
  name: string
  kind: LayerKind
  visible: boolean
  opacity: number
  zIndex: number
  minResolution?: number
  maxResolution?: number
  minZoom?: number
  maxZoom?: number
  metadata: Record<string, unknown>
  parentId: string | null
  sortOrder: number
  createdAt: number
  updatedAt: number
}

export interface WmsLayer extends LayerBase {
  kind: 'wms'
  source: WmsSourceConfig
}

export interface WfsLayer extends LayerBase {
  kind: 'wfs'
  source: WfsSourceConfig
  style?: LayerStyleDefinition
}

export interface ArcGisMapServerLayer extends LayerBase {
  kind: 'arcgis-mapserver'
  source: ArcGisMapServerSourceConfig
}

export interface ArcGisFeatureServerLayer extends LayerBase {
  kind: 'arcgis-featureserver'
  source: ArcGisFeatureServerSourceConfig
  style?: LayerStyleDefinition
}

export interface GeoJsonLayer extends LayerBase {
  kind: 'geojson'
  source: GeoJsonSourceConfig
  style?: LayerStyleDefinition
}

export interface XyzTileLayer extends LayerBase {
  kind: 'xyz-tile'
  source: XyzTileSourceConfig
}

export interface VectorTileLayer extends LayerBase {
  kind: 'vector-tile'
  source: VectorTileSourceConfig
  style?: LayerStyleDefinition
}

export interface WmtsLayer extends LayerBase {
  kind: 'wmts'
  source: WmtsSourceConfig
}

export interface WcsLayer extends LayerBase {
  kind: 'wcs'
  source: WcsSourceConfig
}

export interface GroupLayer extends LayerBase {
  kind: 'group'
  source?: never
  expanded: boolean
}

export type LayerDefinition =
  | WmsLayer
  | WfsLayer
  | ArcGisMapServerLayer
  | ArcGisFeatureServerLayer
  | GeoJsonLayer
  | XyzTileLayer
  | VectorTileLayer
  | WmtsLayer
  | WcsLayer
  | GroupLayer

export type LayerTree = Array<LayerDefinition>

export interface LayerTreeNode {
  layer: LayerDefinition
  children: Array<LayerTreeNode>
}
