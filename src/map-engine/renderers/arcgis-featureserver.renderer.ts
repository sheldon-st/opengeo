import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import EsriJSON from 'ol/format/EsriJSON'
import { tile as tileStrategy } from 'ol/loadingstrategy'
import { createXYZ } from 'ol/tilegrid'
import { compileToArcGisWhere } from '../filter/compilers/arcgis'
import {
  buildVectorOlLayer,
  disposeVectorOlLayer,
  updateCommonLayerProps,
} from './common'
import { composeWithLabelConfig, convertLayerStyle } from './style-utils'
import { convertDrawingInfoToOLStyle } from './arcgis-style-utils'
import type OlBaseLayer from 'ol/layer/Base'
import type OlStyle from 'ol/style/Style'
import type { StyleFunction } from 'ol/style/Style'
import type { LayerRenderer } from '../registry/types'
import type {
  ArcGisFeatureServerLayer,
  LayerDefinition,
} from '../types/layer.types'
import type { MapEngine } from '../engine/map-engine'
import type { ArcGisDrawingInfo } from '@/lib/arcgis-rest'

function isArcGisFeatureServerLayer(
  layer: LayerDefinition,
): layer is ArcGisFeatureServerLayer {
  return layer.kind === 'arcgis-featureserver'
}

function applyLayerStyle(
  olLayer: VectorLayer,
  layer: ArcGisFeatureServerLayer,
): void {
  // HeatmapLayer renders using weight/gradient — vector styles don't apply
  if (layer.vectorRenderer?.kind === 'heatmap') return

  const drawingInfo = layer.metadata?.arcgisDrawingInfo as
    | ArcGisDrawingInfo
    | undefined
  let baseStyle: OlStyle | Array<OlStyle> | StyleFunction | undefined
  if (drawingInfo) {
    baseStyle = convertDrawingInfoToOLStyle(drawingInfo)
  } else if (layer.style) {
    baseStyle = convertLayerStyle(layer.style)
  }

  const style = composeWithLabelConfig(baseStyle, layer.labelConfig)
  if (style) olLayer.setStyle(style)
}

export const arcgisFeatureServerPredicate = (layer: LayerDefinition): boolean =>
  layer.kind === 'arcgis-featureserver'

export const arcgisFeatureServerRenderer: LayerRenderer = {
  create(layer: LayerDefinition, _engine: MapEngine): OlBaseLayer {
    if (!isArcGisFeatureServerLayer(layer))
      throw new Error('Expected ArcGIS FeatureServer layer')

    const { source } = layer
    const esriFormat = new EsriJSON()

    const vectorSource = new VectorSource({
      format: esriFormat,
      strategy: tileStrategy(createXYZ({ tileSize: 512 })),
      loader: function (extent) {
        const params = new URLSearchParams({
          f: 'json',
          returnGeometry: 'true',
          spatialRel: 'esriSpatialRelIntersects',
          geometry: JSON.stringify({
            xmin: extent[0],
            ymin: extent[1],
            xmax: extent[2],
            ymax: extent[3],
            spatialReference: { wkid: 102100 },
          }),
          geometryType: 'esriGeometryEnvelope',
          inSR: '102100',
          outSR: '102100',
          outFields: source.outFields?.join(',') ?? '*',
        })
        // Structured filter takes precedence over raw source.where
        const effectiveWhere = layer.filter
          ? compileToArcGisWhere(layer.filter)
          : source.where
        if (effectiveWhere) params.set('where', effectiveWhere)
        if (source.token) params.set('token', source.token)

        const url = `${source.url}/query?${params.toString()}`
        fetch(url)
          .then((res) => res.json())
          .then((data) => {
            const features = esriFormat.readFeatures(data, {
              featureProjection: 'EPSG:3857',
            })
            vectorSource.addFeatures(features)
          })
          .catch((err) => {
            console.error('ArcGIS FeatureServer load error:', err)
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
    if (!isArcGisFeatureServerLayer(prev) || !isArcGisFeatureServerLayer(next))
      return false

    // Changing render mode requires a full recreate (different OL layer class)
    if (
      (prev.vectorRenderer?.kind ?? 'default') !==
      (next.vectorRenderer?.kind ?? 'default')
    ) {
      return false
    }

    updateCommonLayerProps(olLayer, next)

    // Recreate if the data source changed
    if (
      prev.source.url !== next.source.url ||
      prev.source.where !== next.source.where ||
      JSON.stringify(prev.filter) !== JSON.stringify(next.filter)
    ) {
      return false
    }

    if (
      prev.metadata?.arcgisDrawingInfo !== next.metadata?.arcgisDrawingInfo ||
      prev.style !== next.style ||
      prev.labelConfig !== next.labelConfig
    ) {
      applyLayerStyle(olLayer as VectorLayer, next)
    }

    return true
  },

  dispose(olLayer: OlBaseLayer): void {
    disposeVectorOlLayer(olLayer)
  },
}
