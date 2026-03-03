import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { updateCommonLayerProps } from './common'
import { convertLayerStyle } from './style-utils'
import type OlBaseLayer from 'ol/layer/Base'
import type { LayerRenderer } from '../registry/types'
import type { GeoJsonLayer, LayerDefinition } from '../types/layer.types'
import type { MapEngine } from '../engine/map-engine'

function isGeoJsonLayer(layer: LayerDefinition): layer is GeoJsonLayer {
  return layer.kind === 'geojson'
}

export const geojsonLayerPredicate = (layer: LayerDefinition): boolean =>
  layer.kind === 'geojson'

export const geojsonLayerRenderer: LayerRenderer = {
  create(layer: LayerDefinition, _engine: MapEngine): OlBaseLayer {
    if (!isGeoJsonLayer(layer)) throw new Error('Expected GeoJSON layer')

    const { source } = layer
    const format = new GeoJSON()

    let vectorSource: VectorSource

    if (source.url) {
      vectorSource = new VectorSource({
        format,
        url: source.url,
      })
    } else if (source.data) {
      vectorSource = new VectorSource({
        features: format.readFeatures(source.data, {
          featureProjection: 'EPSG:3857',
        }),
      })
    } else {
      vectorSource = new VectorSource()
    }

    const olLayer = new VectorLayer({
      visible: layer.visible,
      opacity: layer.opacity,
      zIndex: layer.zIndex,
      minResolution: layer.minResolution,
      maxResolution: layer.maxResolution,
      minZoom: layer.minZoom,
      maxZoom: layer.maxZoom,
      source: vectorSource,
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
    if (!isGeoJsonLayer(prev) || !isGeoJsonLayer(next)) return false

    updateCommonLayerProps(olLayer, next)

    if (
      prev.source.url !== next.source.url ||
      prev.source.data !== next.source.data
    ) {
      return false
    }

    return true
  },

  dispose(olLayer: OlBaseLayer): void {
    const src = (olLayer as VectorLayer).getSource()
    src?.dispose()
  },
}
