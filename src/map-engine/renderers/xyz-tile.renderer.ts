import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import { updateCommonLayerProps } from './common'
import type OlBaseLayer from 'ol/layer/Base'
import type { LayerRenderer } from '../registry/types'
import type { LayerDefinition, XyzTileLayer } from '../types/layer.types'
import type { MapEngine } from '../engine/map-engine'

function isXyzTileLayer(layer: LayerDefinition): layer is XyzTileLayer {
  return layer.kind === 'xyz-tile'
}

export const xyzTilePredicate = (layer: LayerDefinition): boolean =>
  layer.kind === 'xyz-tile'

export const xyzTileRenderer: LayerRenderer = {
  create(layer: LayerDefinition, _engine: MapEngine): OlBaseLayer {
    if (!isXyzTileLayer(layer)) throw new Error('Expected XYZ tile layer')

    const { source } = layer

    return new TileLayer({
      visible: layer.visible,
      opacity: layer.opacity,
      zIndex: layer.zIndex,
      minResolution: layer.minResolution,
      maxResolution: layer.maxResolution,
      minZoom: layer.minZoom,
      maxZoom: layer.maxZoom,
      source: new XYZ({
        url: source.url,
        minZoom: source.minZoom,
        maxZoom: source.maxZoom,
        tileSize: source.tileSize,
        attributions: source.attributions,
      }),
      properties: { domainLayerId: layer.id },
    })
  },

  update(
    olLayer: OlBaseLayer,
    prev: LayerDefinition,
    next: LayerDefinition,
  ): boolean {
    if (!isXyzTileLayer(prev) || !isXyzTileLayer(next)) return false

    updateCommonLayerProps(olLayer, next)

    if (prev.source.url !== next.source.url) {
      return false
    }

    return true
  },

  dispose(olLayer: OlBaseLayer): void {
    const src = (olLayer as TileLayer<XYZ>).getSource()
    src?.dispose()
  },
}
