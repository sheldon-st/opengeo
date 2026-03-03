import { generateId } from '../utils/id'
import type { XyzTileLayer } from '../types/layer.types'

export type BaseLayerPresetId =
  | 'osm'
  | 'carto-light'
  | 'carto-dark'
  | 'esri-satellite'
  | 'esri-topo'

export interface BaseLayerPreset {
  id: BaseLayerPresetId
  label: string
  color: string
  createLayer: () => XyzTileLayer
}

function makePreset(
  presetId: BaseLayerPresetId,
  name: string,
  url: string,
  attributions?: string,
): BaseLayerPreset['createLayer'] {
  return () => {
    const now = Date.now()
    return {
      id: generateId('base'),
      kind: 'xyz-tile',
      name,
      visible: true,
      opacity: 1,
      zIndex: 0,
      parentId: null,
      sortOrder: 0,
      metadata: { presetId },
      createdAt: now,
      updatedAt: now,
      source: {
        url,
        attributions,
        maxZoom: 19,
      },
    }
  }
}

export const BASE_LAYER_PRESETS: Array<BaseLayerPreset> = [
  {
    id: 'osm',
    label: 'OpenStreetMap',
    color: '#a8d4a8',
    createLayer: makePreset(
      'osm',
      'OpenStreetMap',
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ),
  },
  {
    id: 'carto-light',
    label: 'Light',
    color: '#f0ede9',
    createLayer: makePreset(
      'carto-light',
      'CartoDB Positron',
      'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      '© <a href="https://carto.com/">CARTO</a>',
    ),
  },
  {
    id: 'carto-dark',
    label: 'Dark',
    color: '#1a1a2e',
    createLayer: makePreset(
      'carto-dark',
      'CartoDB Dark Matter',
      'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      '© <a href="https://carto.com/">CARTO</a>',
    ),
  },
  {
    id: 'esri-satellite',
    label: 'Satellite',
    color: '#4a7c59',
    createLayer: makePreset(
      'esri-satellite',
      'ESRI World Imagery',
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      'Tiles © Esri',
    ),
  },
  {
    id: 'esri-topo',
    label: 'Topo',
    color: '#c8b89a',
    createLayer: makePreset(
      'esri-topo',
      'ESRI World Topo',
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      'Tiles © Esri',
    ),
  },
]

export function getActivePresetId(
  baseLayer: { metadata?: Record<string, unknown> } | null,
): BaseLayerPresetId | null {
  if (!baseLayer) return null
  const presetId = baseLayer.metadata?.presetId
  if (typeof presetId === 'string') return presetId as BaseLayerPresetId
  return null
}
