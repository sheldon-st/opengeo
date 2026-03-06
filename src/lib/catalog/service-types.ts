import type { ServiceTypeInfo } from './types'

const SERVICE_TYPE_MAP: Record<string, ServiceTypeInfo> = {
  'arcgis-mapserver': {
    label: 'ArcGIS MapServer',
    category: 'arcgis',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-300 dark:border-green-700',
  },
  'arcgis-featureserver': {
    label: 'ArcGIS FeatureServer',
    category: 'arcgis',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-300 dark:border-blue-700',
  },
  'arcgis-imageserver': {
    label: 'ArcGIS ImageServer',
    category: 'arcgis',
    color: 'text-teal-700 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950',
    borderColor: 'border-teal-300 dark:border-teal-700',
  },
  'arcgis-vectortileserver': {
    label: 'ArcGIS VectorTile',
    category: 'arcgis',
    color: 'text-cyan-700 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950',
    borderColor: 'border-cyan-300 dark:border-cyan-700',
  },
  'ogc-wms': {
    label: 'WMS',
    category: 'ogc',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-300 dark:border-purple-700',
  },
  'ogc-wfs': {
    label: 'WFS',
    category: 'ogc',
    color: 'text-violet-700 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950',
    borderColor: 'border-violet-300 dark:border-violet-700',
  },
  'ogc-wmts': {
    label: 'WMTS',
    category: 'ogc',
    color: 'text-indigo-700 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    borderColor: 'border-indigo-300 dark:border-indigo-700',
  },
  'ogc-wcs': {
    label: 'WCS',
    category: 'ogc',
    color: 'text-fuchsia-700 dark:text-fuchsia-400',
    bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-950',
    borderColor: 'border-fuchsia-300 dark:border-fuchsia-700',
  },
  'ogc-api-features': {
    label: 'OGC Features',
    category: 'ogc',
    color: 'text-violet-700 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950',
    borderColor: 'border-violet-300 dark:border-violet-700',
  },
  'ogc-api-tiles': {
    label: 'OGC Tiles',
    category: 'ogc',
    color: 'text-indigo-700 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    borderColor: 'border-indigo-300 dark:border-indigo-700',
  },
  'stac-collection': {
    label: 'STAC',
    category: 'data',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    borderColor: 'border-amber-300 dark:border-amber-700',
  },
  tilejson: {
    label: 'TileJSON',
    category: 'tile',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-300 dark:border-orange-700',
  },
  xyz: {
    label: 'XYZ Tiles',
    category: 'tile',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-300 dark:border-orange-700',
  },
  geojson: {
    label: 'GeoJSON',
    category: 'data',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
  },
}

const DEFAULT_TYPE_INFO: ServiceTypeInfo = {
  label: 'Unknown',
  category: 'other',
  color: 'text-gray-700 dark:text-gray-400',
  bgColor: 'bg-gray-50 dark:bg-gray-950',
  borderColor: 'border-gray-300 dark:border-gray-700',
}

export function getServiceTypeInfo(serviceType: string): ServiceTypeInfo {
  return (
    SERVICE_TYPE_MAP[serviceType] ?? {
      ...DEFAULT_TYPE_INFO,
      label: serviceType,
    }
  )
}

export function getHealthColor(status: string | null): {
  dot: string
  text: string
} {
  switch (status) {
    case 'healthy':
      return { dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400' }
    case 'degraded':
      return {
        dot: 'bg-yellow-500',
        text: 'text-yellow-600 dark:text-yellow-400',
      }
    case 'offline':
      return { dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' }
    default:
      return { dot: 'bg-gray-400', text: 'text-muted-foreground' }
  }
}
