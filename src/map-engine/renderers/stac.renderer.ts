import STACLayer from 'ol-stac'
import { updateCommonLayerProps } from './common'
import type OlBaseLayer from 'ol/layer/Base'
import type { LayerRenderer } from '../registry/types'
import type { LayerDefinition, StacLayer } from '../types/layer.types'
import type { MapEngine } from '../engine/map-engine'

function isStacLayer(layer: LayerDefinition): layer is StacLayer {
  return layer.kind === 'stac'
}

export const stacPredicate = (layer: LayerDefinition): boolean =>
  layer.kind === 'stac'

export const stacRenderer: LayerRenderer = {
  create(layer: LayerDefinition, _engine: MapEngine): OlBaseLayer {
    if (!isStacLayer(layer)) throw new Error('Expected STAC layer')

    const { source } = layer

    return new STACLayer({
      url: source.url,
      assets: source.assets,
      bands: source.bands,
      displayFootprint: source.displayFootprint ?? true,
      displayOverview: source.displayOverview ?? true,
      displayPreview: source.displayPreview ?? false,
      displayGeoTiffByDefault: source.displayGeoTiffByDefault ?? false,
      visible: layer.visible,
      opacity: layer.opacity,
      zIndex: layer.zIndex,
      minResolution: layer.minResolution,
      maxResolution: layer.maxResolution,
      minZoom: layer.minZoom,
      maxZoom: layer.maxZoom,
      properties: { domainLayerId: layer.id },
    })
  },

  update(
    olLayer: OlBaseLayer,
    prev: LayerDefinition,
    next: LayerDefinition,
  ): boolean {
    if (!isStacLayer(prev) || !isStacLayer(next)) return false

    updateCommonLayerProps(olLayer, next)

    // Force recreate if the STAC URL or asset selection changed
    if (
      prev.source.url !== next.source.url ||
      JSON.stringify(prev.source.assets) !==
        JSON.stringify(next.source.assets) ||
      JSON.stringify(prev.source.bands) !== JSON.stringify(next.source.bands)
    ) {
      return false
    }

    return true
  },

  dispose(olLayer: OlBaseLayer): void {
    const stacLayer = olLayer as STACLayer
    stacLayer.getLayers().forEach((l) => {
      const src = (l as import('ol/layer/Layer').default).getSource?.()
      src?.dispose()
    })
  },
}
