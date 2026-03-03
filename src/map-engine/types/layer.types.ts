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

// ─── Vector Layer Shared Types ────────────────────────────────────────────────

export interface DefaultVectorRenderer {
  kind: 'default'
}

export interface HeatmapVectorRenderer {
  kind: 'heatmap'
  /** Feature property (0–1) used as heat weight. Omit to weight all features equally. */
  weightProperty?: string
  /** Blur size in pixels. Default: 15 */
  blur?: number
  /** Radius in pixels. Default: 8 */
  radius?: number
  /** CSS color stops, e.g. ['blue', 'yellow', 'red']. Uses OL default if omitted. */
  gradient?: string[]
}

export interface ClusterVectorRenderer {
  kind: 'cluster'
  /** Pixel distance within which features are clustered. Default: 40 */
  distance?: number
  /** Minimum pixel distance between cluster centers. Default: 0 */
  minDistance?: number
}

export type VectorRendererConfig =
  | DefaultVectorRenderer
  | HeatmapVectorRenderer
  | ClusterVectorRenderer

export interface LabelConfig {
  /** Feature property key whose value is rendered as the label text. */
  property: string
  font?: string
  color?: string
  haloColor?: string
  haloWidth?: number
  offsetX?: number
  offsetY?: number
  placement?: 'point' | 'line'
  overflow?: boolean
  showBackground?: boolean
}

export interface VectorLayerBase extends LayerBase {
  style?: LayerStyleDefinition
  /** Controls how features are rendered. Defaults to 'default' (per-feature styling). */
  vectorRenderer?: VectorRendererConfig
  /** When set, renders a text label on each feature using the specified property. */
  labelConfig?: LabelConfig
}

// ─── Concrete Layer Types ─────────────────────────────────────────────────────

export interface WmsLayer extends LayerBase {
  kind: 'wms'
  source: WmsSourceConfig
}

export interface WfsLayer extends VectorLayerBase {
  kind: 'wfs'
  source: WfsSourceConfig
}

export interface ArcGisMapServerLayer extends LayerBase {
  kind: 'arcgis-mapserver'
  source: ArcGisMapServerSourceConfig
}

export interface ArcGisFeatureServerLayer extends VectorLayerBase {
  kind: 'arcgis-featureserver'
  source: ArcGisFeatureServerSourceConfig
  /**
   * Field list populated from the ArcGIS service spec (ArcGisLayerInfo.fields).
   * Used by the UI to offer a label field picker — not consumed by the renderer.
   */
  availableLabelFields?: Array<{ name: string; alias: string }>
}

export interface GeoJsonLayer extends VectorLayerBase {
  kind: 'geojson'
  source: GeoJsonSourceConfig
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
