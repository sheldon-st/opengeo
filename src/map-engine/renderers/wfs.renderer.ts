import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { bbox as bboxStrategy } from 'ol/loadingstrategy'
import { compileToCql } from '../filter/compilers/cql'
import {
  buildVectorOlLayer,
  disposeVectorOlLayer,
  updateCommonLayerProps,
} from './common'
import { composeWithLabelConfig, convertLayerStyle } from './style-utils'
import type OlBaseLayer from 'ol/layer/Base'
import type OlStyle from 'ol/style/Style'
import type { StyleFunction } from 'ol/style/Style'
import type { LayerRenderer } from '../registry/types'
import type { LayerDefinition, WfsLayer } from '../types/layer.types'
import type { MapEngine } from '../engine/map-engine'

function isWfsLayer(layer: LayerDefinition): layer is WfsLayer {
  return layer.kind === 'wfs'
}

function applyLayerStyle(olLayer: VectorLayer, layer: WfsLayer): void {
  // HeatmapLayer renders using weight/gradient — vector styles don't apply
  if (layer.vectorRenderer?.kind === 'heatmap') return

  const baseStyle = layer.style ? convertLayerStyle(layer.style) : undefined
  const style = composeWithLabelConfig(baseStyle, layer.labelConfig)
  if (style) olLayer.setStyle(style)
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
        // Structured filter takes precedence over raw source.filter
        const effectiveCql = layer.filter
          ? compileToCql(layer.filter)
          : source.filter
        if (effectiveCql) {
          params.set('CQL_FILTER', effectiveCql)
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

    const olLayer = buildVectorOlLayer(vectorSource, layer)
    if (olLayer instanceof VectorLayer) applyLayerStyle(olLayer, layer)

    return olLayer
  },

  update(
    olLayer: OlBaseLayer,
    prev: LayerDefinition,
    next: LayerDefinition,
  ): boolean {
    if (!isWfsLayer(prev) || !isWfsLayer(next)) return false

    // Changing render mode requires a full recreate (different OL layer class)
    if (
      (prev.vectorRenderer?.kind ?? 'default') !==
      (next.vectorRenderer?.kind ?? 'default')
    ) {
      return false
    }

    updateCommonLayerProps(olLayer, next)

    if (
      prev.source.url !== next.source.url ||
      prev.source.typeName !== next.source.typeName ||
      prev.source.filter !== next.source.filter ||
      JSON.stringify(prev.filter) !== JSON.stringify(next.filter)
    ) {
      return false
    }

    if (prev.style !== next.style || prev.labelConfig !== next.labelConfig) {
      applyLayerStyle(olLayer as VectorLayer, next)
    }

    return true
  },

  dispose(olLayer: OlBaseLayer): void {
    disposeVectorOlLayer(olLayer)
  },
}
