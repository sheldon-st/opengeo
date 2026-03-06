import type { LayerKind } from '@/map-engine/types/layer.types'
import type { CatalogService } from './types'

type LayerInput = Parameters<
  import('@/map-engine/engine/map-engine').MapEngine['addLayer']
>[0]

/** Map catalog serviceType → engine LayerKind. Returns null if unsupported. */
export function catalogTypeToLayerKind(serviceType: string): LayerKind | null {
  switch (serviceType) {
    case 'arcgis-mapserver':
      return 'arcgis-mapserver'
    case 'arcgis-featureserver':
      return 'arcgis-featureserver'
    case 'arcgis-vectortileserver':
      return 'vector-tile'
    case 'ogc-wms':
      return 'wms'
    case 'ogc-wfs':
      return 'wfs'
    case 'ogc-wmts':
      return 'wmts'
    case 'ogc-wcs':
      return 'wcs'
    case 'ogc-api-features':
    case 'geojson':
      return 'geojson'
    case 'xyz':
    case 'tilejson':
    case 'ogc-api-tiles':
      return 'xyz-tile'
    default:
      return null
  }
}

/** Build initial source config from a catalog service, pre-populating fields from catalog metadata. */
export function catalogServiceToSourceConfig(
  service: CatalogService,
): Record<string, unknown> {
  switch (service.serviceType) {
    case 'arcgis-mapserver':
      return { url: service.url }
    case 'arcgis-featureserver':
      return { url: service.url, where: '1=1', outFields: ['*'] }
    case 'arcgis-vectortileserver':
      return { url: service.url, format: 'mvt' }
    case 'ogc-wms':
      return {
        url: service.url,
        layers: service.layers?.map((l) => l.name).join(',') ?? '',
        format: 'image/png',
        version: '1.3.0',
        transparent: true,
      }
    case 'ogc-wfs':
      return {
        url: service.url,
        typeName: service.layers?.[0]?.name ?? '',
        version: '2.0.0',
        outputFormat: 'application/json',
      }
    case 'ogc-wmts':
      return {
        url: service.url,
        layer: service.layers?.[0]?.name ?? '',
        matrixSet: 'EPSG:3857',
        format: service.formats?.[0] ?? 'image/png',
      }
    case 'ogc-wcs':
      return {
        url: service.url,
        coverageId: service.layers?.[0]?.name ?? '',
        version: '2.0.1',
        bbox: service.bbox ?? undefined,
      }
    case 'ogc-api-features':
    case 'geojson':
      return { url: service.url }
    case 'xyz':
    case 'tilejson':
    case 'ogc-api-tiles':
      return { url: service.url }
    default:
      return { url: service.url }
  }
}

/**
 * Build a complete LayerInput from a catalog service.
 * Returns null if the service type is not supported.
 */
export function catalogServiceToLayer(
  service: CatalogService,
): LayerInput | null {
  const kind = catalogTypeToLayerKind(service.serviceType)
  if (!kind) return null

  return {
    name: service.title ?? service.url,
    kind,
    visible: true,
    opacity: 1,
    zIndex: 0,
    parentId: null,
    metadata: {
      catalogId: service.id,
      catalogServiceType: service.serviceType,
      catalogSource: service.source,
    },
    source: catalogServiceToSourceConfig(service),
  } as LayerInput
}

/** Check if a service type can be added to the map */
export function isAddableServiceType(serviceType: string): boolean {
  return catalogTypeToLayerKind(serviceType) !== null
}
