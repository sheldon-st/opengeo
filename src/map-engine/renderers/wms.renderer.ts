import ImageLayer from 'ol/layer/Image'
import TileLayer from 'ol/layer/Tile'
import ImageWMS from 'ol/source/ImageWMS'
import TileWMS from 'ol/source/TileWMS'
import { updateCommonLayerProps } from './common'
import type OlBaseLayer from 'ol/layer/Base'
import type { LayerRenderer } from '../registry/types'
import type { LayerDefinition, WmsLayer } from '../types/layer.types'
import type { MapEngine } from '../engine/map-engine'

function isWmsLayer(layer: LayerDefinition): layer is WmsLayer {
  return layer.kind === 'wms'
}

export const wmsLayerPredicate = (layer: LayerDefinition): boolean =>
  layer.kind === 'wms'

export const wmsLayerRenderer: LayerRenderer = {
  create(layer: LayerDefinition, _engine: MapEngine): OlBaseLayer {
    if (!isWmsLayer(layer)) throw new Error('Expected WMS layer')

    const { source } = layer
    const commonParams: Record<string, unknown> = {
      LAYERS: source.layers,
      FORMAT: source.format ?? 'image/png',
      TRANSPARENT: source.transparent ?? true,
      VERSION: source.version ?? '1.3.0',
      ...source.extraParams,
    }

    if (source.tiled) {
      return new TileLayer({
        visible: layer.visible,
        opacity: layer.opacity,
        zIndex: layer.zIndex,
        minResolution: layer.minResolution,
        maxResolution: layer.maxResolution,
        minZoom: layer.minZoom,
        maxZoom: layer.maxZoom,
        source: new TileWMS({
          url: source.url,
          params: commonParams,
        }),
        properties: { domainLayerId: layer.id },
      })
    }

    return new ImageLayer({
      visible: layer.visible,
      opacity: layer.opacity,
      zIndex: layer.zIndex,
      minResolution: layer.minResolution,
      maxResolution: layer.maxResolution,
      minZoom: layer.minZoom,
      maxZoom: layer.maxZoom,
      source: new ImageWMS({
        url: source.url,
        params: commonParams,
      }),
      properties: { domainLayerId: layer.id },
    })
  },

  update(
    olLayer: OlBaseLayer,
    prev: LayerDefinition,
    next: LayerDefinition,
  ): boolean {
    if (!isWmsLayer(prev) || !isWmsLayer(next)) return false

    updateCommonLayerProps(olLayer, next)

    if (
      prev.source.url !== next.source.url ||
      prev.source.layers !== next.source.layers ||
      prev.source.tiled !== next.source.tiled
    ) {
      return false
    }

    const olSource =
      (olLayer as ImageLayer<ImageWMS>).getSource?.() ??
      (olLayer as TileLayer<TileWMS>).getSource?.()
    if (olSource && 'updateParams' in olSource) {
      olSource.updateParams({
        LAYERS: next.source.layers,
        FORMAT: next.source.format ?? 'image/png',
        ...next.source.extraParams,
      })
    }

    return true
  },

  dispose(olLayer: OlBaseLayer): void {
    const src =
      (olLayer as ImageLayer<ImageWMS>).getSource?.() ??
      (olLayer as TileLayer<TileWMS>).getSource?.()
    src?.dispose()
  },
}
