import VectorTileLayer from 'ol/layer/VectorTile'
import VectorTileSource from 'ol/source/VectorTile'
import MVT from 'ol/format/MVT'
import { updateCommonLayerProps } from './common'
import { convertLayerStyle } from './style-utils'
import type OlBaseLayer from 'ol/layer/Base'
import type { LayerRenderer } from '../registry/types'
import type {
  LayerDefinition,
  VectorTileLayer as VTLayerDef,
} from '../types/layer.types'
import type { MapEngine } from '../engine/map-engine'

function isVectorTileLayer(layer: LayerDefinition): layer is VTLayerDef {
  return layer.kind === 'vector-tile'
}

export const vectorTilePredicate = (layer: LayerDefinition): boolean =>
  layer.kind === 'vector-tile'

export const vectorTileRenderer: LayerRenderer = {
  create(layer: LayerDefinition, _engine: MapEngine): OlBaseLayer {
    if (!isVectorTileLayer(layer)) throw new Error('Expected vector tile layer')

    const { source } = layer
    const olLayer = new VectorTileLayer({
      visible: layer.visible,
      opacity: layer.opacity,
      zIndex: layer.zIndex,
      minResolution: layer.minResolution,
      maxResolution: layer.maxResolution,
      minZoom: layer.minZoom,
      maxZoom: layer.maxZoom,
      source: new VectorTileSource({
        format: new MVT(),
        url: source.url,
        minZoom: source.minZoom,
        maxZoom: source.maxZoom,
        attributions: source.attributions,
      }),
      properties: { domainLayerId: layer.id },
    })

    if (layer.style) {
      const olStyle = convertLayerStyle(layer.style)
      olLayer.setStyle(Array.isArray(olStyle) ? olStyle : olStyle)
    }

    return olLayer
  },

  update(
    olLayer: OlBaseLayer,
    prev: LayerDefinition,
    next: LayerDefinition,
  ): boolean {
    if (!isVectorTileLayer(prev) || !isVectorTileLayer(next)) return false

    updateCommonLayerProps(olLayer, next)

    if (prev.source.url !== next.source.url) {
      return false
    }

    return true
  },

  dispose(olLayer: OlBaseLayer): void {
    const src = (olLayer as VectorTileLayer).getSource()
    src?.dispose()
  },
}
