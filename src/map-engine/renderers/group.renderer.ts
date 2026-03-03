import LayerGroup from 'ol/layer/Group'
import { updateCommonLayerProps } from './common'
import type OlBaseLayer from 'ol/layer/Base'
import type { LayerRenderer } from '../registry/types'
import type { GroupLayer, LayerDefinition } from '../types/layer.types'
import type { MapEngine } from '../engine/map-engine'

function isGroupLayer(layer: LayerDefinition): layer is GroupLayer {
  return layer.kind === 'group'
}

export const groupPredicate = (layer: LayerDefinition): boolean =>
  layer.kind === 'group'

export const groupRenderer: LayerRenderer = {
  create(layer: LayerDefinition, _engine: MapEngine): OlBaseLayer {
    if (!isGroupLayer(layer)) throw new Error('Expected group layer')

    return new LayerGroup({
      visible: layer.visible,
      opacity: layer.opacity,
      zIndex: layer.zIndex,
      properties: { domainLayerId: layer.id },
    })
  },

  update(
    olLayer: OlBaseLayer,
    prev: LayerDefinition,
    next: LayerDefinition,
  ): boolean {
    if (!isGroupLayer(prev) || !isGroupLayer(next)) return false
    updateCommonLayerProps(olLayer, next)
    return true
  },
}
