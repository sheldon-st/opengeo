import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
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
import type { GeoJsonLayer, LayerDefinition } from '../types/layer.types'
import type { MapEngine } from '../engine/map-engine'

function isGeoJsonLayer(layer: LayerDefinition): layer is GeoJsonLayer {
  return layer.kind === 'geojson'
}

function applyLayerStyle(olLayer: VectorLayer, layer: GeoJsonLayer): void {
  // HeatmapLayer renders using weight/gradient — vector styles don't apply
  if (layer.vectorRenderer?.kind === 'heatmap') return

  const baseStyle = layer.style ? convertLayerStyle(layer.style) : undefined
  const style = composeWithLabelConfig(baseStyle, layer.labelConfig)
  if (style) olLayer.setStyle(style as StyleFunction | OlStyle | OlStyle[])
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
      vectorSource = new VectorSource({ format, url: source.url })
    } else if (source.data) {
      vectorSource = new VectorSource({
        features: format.readFeatures(source.data, {
          featureProjection: 'EPSG:3857',
        }),
      })
    } else {
      vectorSource = new VectorSource()
    }

    const olLayer = buildVectorOlLayer(vectorSource, layer)
    if (olLayer instanceof VectorLayer) applyLayerStyle(olLayer, layer)

    return olLayer
  },

  update(
    olLayer: OlBaseLayer,
    prev: LayerDefinition,
    next: LayerDefinition,
  ): boolean {
    if (!isGeoJsonLayer(prev) || !isGeoJsonLayer(next)) return false

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
      prev.source.data !== next.source.data
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
