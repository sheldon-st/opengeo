import TileLayer from 'ol/layer/Tile'
import WMTS from 'ol/source/WMTS'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import { get as getProjection } from 'ol/proj'
import { getTopLeft, getWidth } from 'ol/extent'
import { updateCommonLayerProps } from './common'
import type OlBaseLayer from 'ol/layer/Base'
import type { LayerRenderer } from '../registry/types'
import type { LayerDefinition, WmtsLayer } from '../types/layer.types'
import type { MapEngine } from '../engine/map-engine'

function isWmtsLayer(layer: LayerDefinition): layer is WmtsLayer {
  return layer.kind === 'wmts'
}

export const wmtsPredicate = (layer: LayerDefinition): boolean =>
  layer.kind === 'wmts'

function createDefaultTileGrid() {
  const projection = getProjection('EPSG:3857')!
  const projectionExtent = projection.getExtent()
  const size = getWidth(projectionExtent) / 256
  const resolutions = new Array(21)
  const matrixIds = new Array(21)
  for (let z = 0; z < 21; ++z) {
    resolutions[z] = size / Math.pow(2, z)
    matrixIds[z] = String(z)
  }
  return new WMTSTileGrid({
    origin: getTopLeft(projectionExtent),
    resolutions,
    matrixIds,
  })
}

export const wmtsRenderer: LayerRenderer = {
  create(layer: LayerDefinition, _engine: MapEngine): OlBaseLayer {
    if (!isWmtsLayer(layer)) throw new Error('Expected WMTS layer')

    const { source } = layer

    return new TileLayer({
      visible: layer.visible,
      opacity: layer.opacity,
      zIndex: layer.zIndex,
      minResolution: layer.minResolution,
      maxResolution: layer.maxResolution,
      minZoom: layer.minZoom,
      maxZoom: layer.maxZoom,
      source: new WMTS({
        url: source.url,
        layer: source.layer,
        matrixSet: source.matrixSet,
        format: source.format ?? 'image/png',
        style: source.style ?? 'default',
        tileGrid: createDefaultTileGrid(),
        version: source.version,
      }),
      properties: { domainLayerId: layer.id },
    })
  },

  update(
    olLayer: OlBaseLayer,
    prev: LayerDefinition,
    next: LayerDefinition,
  ): boolean {
    if (!isWmtsLayer(prev) || !isWmtsLayer(next)) return false

    updateCommonLayerProps(olLayer, next)

    if (
      prev.source.url !== next.source.url ||
      prev.source.layer !== next.source.layer ||
      prev.source.matrixSet !== next.source.matrixSet
    ) {
      return false
    }

    return true
  },

  dispose(olLayer: OlBaseLayer): void {
    const src = (olLayer as TileLayer<WMTS>).getSource()
    src?.dispose()
  },
}
