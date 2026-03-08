import {
  Database,
  FileJson,
  Folder,
  FolderOpen,
  Globe,
  Grid3x3,
  Image,
  Layers,
  Map,
  Scan,
  Shapes,
} from 'lucide-react'
import type { LayerKind } from '@/map-engine'
import { cn } from '@/lib/utils'

const iconMap: Record<
  LayerKind,
  React.ComponentType<{ className?: string }>
> = {
  wms: Image,
  wfs: Shapes,
  'arcgis-mapserver': Map,
  'arcgis-featureserver': Database,
  geojson: FileJson,
  'xyz-tile': Grid3x3,
  'vector-tile': Layers,
  wmts: Globe,
  wcs: Scan,
  stac: Layers,
  group: Folder,
}

export function LayerIcon({
  kind,
  isOpen,
  className,
}: {
  kind: LayerKind
  isOpen?: boolean
  className?: string
}) {
  if (kind === 'group') {
    const Icon = isOpen ? FolderOpen : Folder
    return <Icon className={cn('h-4 w-4 shrink-0', className)} />
  }
  const Icon = iconMap[kind] ?? Layers
  return <Icon className={cn('h-4 w-4 shrink-0', className)} />
}

const kindLabels: Record<LayerKind, string> = {
  wms: 'WMS',
  wfs: 'WFS',
  'arcgis-mapserver': 'ArcGIS Map',
  'arcgis-featureserver': 'ArcGIS Feature',
  geojson: 'GeoJSON',
  'xyz-tile': 'XYZ Tiles',
  'vector-tile': 'Vector Tiles',
  wmts: 'WMTS',
  wcs: 'WCS',
  stac: 'STAC',
  group: 'Group',
}

export function getKindLabel(kind: LayerKind): string {
  return kindLabels[kind] ?? kind
}
