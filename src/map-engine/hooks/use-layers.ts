import { useMapStore } from '../components/map-provider'
import { selectLayerList, selectLayerTree } from '../store/selectors'
import type { LayerDefinition, LayerTreeNode } from '../types/layer.types'

export function useLayerTree(): Array<LayerTreeNode> {
  return useMapStore(selectLayerTree)
}

export function useLayerList(): Array<LayerDefinition> {
  return useMapStore(selectLayerList)
}
