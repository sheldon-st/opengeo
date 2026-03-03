import type { MapStoreState } from './map-store'
import type { LayerDefinition, LayerTreeNode } from '../types/layer.types'
import type { FeatureDefinition } from '../types/feature.types'

export function selectLayerList(state: MapStoreState): Array<LayerDefinition> {
  return Object.values(state.layers).sort((a, b) => a.sortOrder - b.sortOrder)
}

export function selectRootLayers(state: MapStoreState): Array<LayerDefinition> {
  return selectLayerList(state).filter((l) => l.parentId === null)
}

export function selectLayerTree(state: MapStoreState): Array<LayerTreeNode> {
  const all = selectLayerList(state)
  const byParent = new Map<string | null, Array<LayerDefinition>>()
  for (const layer of all) {
    const key = layer.parentId ?? null
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(layer)
  }

  function buildChildren(parentId: string | null): Array<LayerTreeNode> {
    const children = byParent.get(parentId) ?? []
    return children.map((layer) => ({
      layer,
      children: layer.kind === 'group' ? buildChildren(layer.id) : [],
    }))
  }

  return buildChildren(null)
}

export function selectLayerById(
  state: MapStoreState,
  id: string,
): LayerDefinition | undefined {
  return state.layers[id]
}

export function selectFeaturesByLayerId(
  state: MapStoreState,
  layerId: string,
): Array<FeatureDefinition> {
  return Object.values(state.features).filter((f) => f.layerId === layerId)
}

export function selectVisibleLayers(state: MapStoreState): Array<LayerDefinition> {
  return selectLayerList(state).filter((l) => l.visible)
}

export function selectSelectedFeatures(
  state: MapStoreState,
): Array<FeatureDefinition> {
  return state.selectedFeatureIds
    .map((id) => state.features[id])
    .filter(Boolean)
}
