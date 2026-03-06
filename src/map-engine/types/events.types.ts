import type { LayerDefinition } from './layer.types'
import type { FeatureDefinition } from './feature.types'
import type { MapViewState } from './map.types'

export interface MapEngineEventMap {
  'layer:added': { layer: LayerDefinition }
  'layer:removed': { layerId: string }
  'layer:updated': { layer: LayerDefinition; prev: LayerDefinition }
  'layer:visibility-changed': { layerId: string; visible: boolean }
  'layer:opacity-changed': { layerId: string; opacity: number }
  'layer:reordered': {
    layerId: string
    newSortOrder: number
    parentId: string | null
  }

  'feature:added': { feature: FeatureDefinition }
  'feature:removed': { featureId: string; layerId: string }
  'feature:updated': { feature: FeatureDefinition; prev: FeatureDefinition }
  'feature:selected': { featureIds: Array<string> }
  'feature:deselected': { featureIds: Array<string> }

  'view:changed': { view: MapViewState }
  'view:zoom-changed': { zoom: number }
  'view:center-changed': { center: [number, number] }

  'feature:picked': {
    features: Array<{
      properties: Record<string, unknown>
      layerName?: string
      layerId?: string
    }>
    pixel: [number, number]
    coordinate: [number, number]
  }

  'map:click': { coordinate: [number, number]; pixel: [number, number] }
  'map:dblclick': { coordinate: [number, number]; pixel: [number, number] }
  'map:pointermove': { coordinate: [number, number]; pixel: [number, number] }
  'map:moveend': { view: MapViewState }

  'engine:ready': Record<string, never>
  'engine:disposed': Record<string, never>
  'engine:error': { error: Error; context?: string }
}

export type MapEngineEventName = keyof MapEngineEventMap
