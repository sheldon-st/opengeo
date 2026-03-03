import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { bbox as bboxStrategy } from 'ol/loadingstrategy'
import { updateCommonLayerProps } from './common'
import { convertLayerStyle } from './style-utils'
import type OlBaseLayer from 'ol/layer/Base'
import type { LayerRenderer } from '../registry/types'
import type { LayerDefinition, WfsLayer } from '../types/layer.types'
import type { MapEngine } from '../engine/map-engine'

function isWfsLayer(layer: LayerDefinition): layer is WfsLayer {
  return layer.kind === 'wfs'
}

export const wfsLayerPredicate = (layer: LayerDefinition): boolean =>
  layer.kind === 'wfs'

export const wfsLayerRenderer: LayerRenderer = {
  create(layer: LayerDefinition, _engine: MapEngine): OlBaseLayer {
    if (!isWfsLayer(layer)) throw new Error('Expected WFS layer')

    const { source } = layer
    const version = source.version ?? '2.0.0'
    const outputFormat = source.outputFormat ?? 'application/json'

    const vectorSource = new VectorSource({
      format: new GeoJSON(),
      strategy: bboxStrategy,
      loader: function (extent, _resolution, projection) {
        const srs = projection.getCode()
        const params = new URLSearchParams({
          service: 'WFS',
          version,
          request: 'GetFeature',
          typeName: source.typeName,
          outputFormat,
          srsname: srs,
          bbox: `${extent.join(',')},${srs}`,
        })
        if (source.maxFeatures) {
          params.set(
            version.startsWith('2') ? 'count' : 'maxFeatures',
            String(source.maxFeatures),
          )
        }
        if (source.filter) {
          params.set('CQL_FILTER', source.filter)
        }

        const url = `${source.url}?${params.toString()}`
        fetch(url)
          .then((res) => res.text())
          .then((text) => {
            const features = new GeoJSON().readFeatures(text)
            vectorSource.addFeatures(features)
          })
          .catch((err) => {
            console.error('WFS load error:', err)
            vectorSource.removeLoadedExtent(extent)
          })
      },
    })

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
    if (!isWfsLayer(prev) || !isWfsLayer(next)) return false

    updateCommonLayerProps(olLayer, next)

    if (
      prev.source.url !== next.source.url ||
      prev.source.typeName !== next.source.typeName ||
      prev.source.filter !== next.source.filter
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
