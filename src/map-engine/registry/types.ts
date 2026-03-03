import type OlBaseLayer from 'ol/layer/Base'
import type OlFeature from 'ol/Feature'
import type OlGeometry from 'ol/geom/Geometry'
import type { LayerDefinition } from '../types/layer.types'
import type { FeatureDefinition } from '../types/feature.types'
import type { MapEngine } from '../engine/map-engine'

export type LayerPredicate = (layer: LayerDefinition) => boolean

export interface LayerRenderer {
  create: (layer: LayerDefinition, engine: MapEngine) => OlBaseLayer
  update: (
    olLayer: OlBaseLayer,
    prev: LayerDefinition,
    next: LayerDefinition,
    engine: MapEngine,
  ) => boolean
  dispose?: (olLayer: OlBaseLayer) => void
}

export type FeaturePredicate = (feature: FeatureDefinition) => boolean

export interface FeatureRenderer {
  create: (feature: FeatureDefinition) => OlFeature<OlGeometry>
  update: (
    olFeature: OlFeature<OlGeometry>,
    prev: FeatureDefinition,
    next: FeatureDefinition,
  ) => boolean
}

export interface LayerRegistryEntry {
  id: string
  predicate: LayerPredicate
  renderer: LayerRenderer
  priority: number
}

export interface FeatureRegistryEntry {
  id: string
  predicate: FeaturePredicate
  renderer: FeatureRenderer
  priority: number
}
