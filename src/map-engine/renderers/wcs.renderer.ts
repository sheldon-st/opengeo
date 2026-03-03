import ImageLayer from 'ol/layer/Image'
import ImageStatic from 'ol/source/ImageStatic'
import { updateCommonLayerProps } from './common'
import type OlBaseLayer from 'ol/layer/Base'
import type { LayerRenderer } from '../registry/types'
import type { LayerDefinition, WcsLayer } from '../types/layer.types'
import type { MapEngine } from '../engine/map-engine'

function isWcsLayer(layer: LayerDefinition): layer is WcsLayer {
  return layer.kind === 'wcs'
}

export const wcsPredicate = (layer: LayerDefinition): boolean =>
  layer.kind === 'wcs'

function buildWcsUrl(source: WcsLayer['source']): string {
  const params = new URLSearchParams({
    service: 'WCS',
    version: source.version ?? '2.0.1',
    request: 'GetCoverage',
    CoverageId: source.coverageId,
    format: source.format ?? 'image/tiff',
  })
  if (source.crs) params.set('outputCrs', source.crs)
  if (source.bbox) {
    params.set(
      'subset',
      `Long(${source.bbox[0]},${source.bbox[2]})&subset=Lat(${source.bbox[1]},${source.bbox[3]})`,
    )
  }
  return `${source.url}?${params.toString()}`
}

export const wcsRenderer: LayerRenderer = {
  create(layer: LayerDefinition, _engine: MapEngine): OlBaseLayer {
    if (!isWcsLayer(layer)) throw new Error('Expected WCS layer')

    const { source } = layer
    const imageUrl = buildWcsUrl(source)
    const extent = source.bbox ?? [-180, -90, 180, 90]

    return new ImageLayer({
      visible: layer.visible,
      opacity: layer.opacity,
      zIndex: layer.zIndex,
      minResolution: layer.minResolution,
      maxResolution: layer.maxResolution,
      minZoom: layer.minZoom,
      maxZoom: layer.maxZoom,
      source: new ImageStatic({
        url: imageUrl,
        imageExtent: extent,
      }),
      properties: { domainLayerId: layer.id },
    })
  },

  update(
    olLayer: OlBaseLayer,
    prev: LayerDefinition,
    next: LayerDefinition,
  ): boolean {
    if (!isWcsLayer(prev) || !isWcsLayer(next)) return false

    updateCommonLayerProps(olLayer, next)

    if (
      prev.source.url !== next.source.url ||
      prev.source.coverageId !== next.source.coverageId
    ) {
      return false
    }

    return true
  },

  dispose(olLayer: OlBaseLayer): void {
    const src = (olLayer as ImageLayer<ImageStatic>).getSource()
    src?.dispose()
  },
}
