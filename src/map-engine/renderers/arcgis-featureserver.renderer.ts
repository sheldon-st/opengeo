import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import EsriJSON from 'ol/format/EsriJSON'
import { tile as tileStrategy } from 'ol/loadingstrategy'
import { createXYZ } from 'ol/tilegrid'
import { updateCommonLayerProps } from './common'
import { convertLayerStyle } from './style-utils'
import type OlBaseLayer from 'ol/layer/Base'
import type { LayerRenderer } from '../registry/types'
import type {
  ArcGisFeatureServerLayer,
  LayerDefinition,
} from '../types/layer.types'
import type { MapEngine } from '../engine/map-engine'

function isArcGisFeatureServerLayer(
  layer: LayerDefinition,
): layer is ArcGisFeatureServerLayer {
  return layer.kind === 'arcgis-featureserver'
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
        if (source.where) params.set('where', source.where)
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
    if (!isArcGisFeatureServerLayer(prev) || !isArcGisFeatureServerLayer(next))
      return false

    updateCommonLayerProps(olLayer, next)

    if (
      prev.source.url !== next.source.url ||
      prev.source.where !== next.source.where
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
