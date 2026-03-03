import TileLayer from 'ol/layer/Tile'
import TileArcGISRest from 'ol/source/TileArcGISRest'
import { updateCommonLayerProps } from './common'
import type OlBaseLayer from 'ol/layer/Base'
import type { LayerRenderer } from '../registry/types'
import type {
  ArcGisMapServerLayer,
  LayerDefinition,
} from '../types/layer.types'
import type { MapEngine } from '../engine/map-engine'

function isArcGisMapServerLayer(
  layer: LayerDefinition,
): layer is ArcGisMapServerLayer {
  return layer.kind === 'arcgis-mapserver'
}

export const arcgisMapServerPredicate = (layer: LayerDefinition): boolean =>
  layer.kind === 'arcgis-mapserver'

export const arcgisMapServerRenderer: LayerRenderer = {
  create(layer: LayerDefinition, _engine: MapEngine): OlBaseLayer {
    if (!isArcGisMapServerLayer(layer))
      throw new Error('Expected ArcGIS MapServer layer')

    const { source } = layer
    const params: Record<string, string> = {}
    if (source.layers) params['LAYERS'] = source.layers
    if (source.format) params['FORMAT'] = source.format
    if (source.dynamicLayers) params['dynamicLayers'] = source.dynamicLayers
    if (source.token) params['token'] = source.token

    return new TileLayer({
      visible: layer.visible,
      opacity: layer.opacity,
      zIndex: layer.zIndex,
      minResolution: layer.minResolution,
      maxResolution: layer.maxResolution,
      minZoom: layer.minZoom,
      maxZoom: layer.maxZoom,
      source: new TileArcGISRest({
        url: source.url,
        params,
      }),
      properties: { domainLayerId: layer.id },
    })
  },

  update(
    olLayer: OlBaseLayer,
    prev: LayerDefinition,
    next: LayerDefinition,
  ): boolean {
    if (!isArcGisMapServerLayer(prev) || !isArcGisMapServerLayer(next))
      return false

    updateCommonLayerProps(olLayer, next)

    if (prev.source.url !== next.source.url) {
      return false
    }

    const src = (olLayer as TileLayer<TileArcGISRest>).getSource()
    if (src) {
      const params: Record<string, string> = {}
      if (next.source.layers) params['LAYERS'] = next.source.layers
      if (next.source.token) params['token'] = next.source.token
      src.updateParams(params)
    }

    return true
  },

  dispose(olLayer: OlBaseLayer): void {
    const src = (olLayer as TileLayer<TileArcGISRest>).getSource()
    src?.dispose()
  },
}
