import type { LayerKind } from '@/map-engine/types/layer.types'

interface SourceDetector {
  kind: LayerKind
  /** Return true if the URL likely points to this source type. */
  test: (url: string) => boolean
}

/**
 * Ordered list of detectors — first match wins.
 * Add new entries here to support additional auto-detection patterns.
 */
const detectors: SourceDetector[] = [
  {
    kind: 'arcgis-featureserver',
    test: (url) => /\/FeatureServer(\/\d+)?\/?(\?|$)/i.test(url),
  },
  {
    kind: 'arcgis-mapserver',
    test: (url) => /\/MapServer(\/\d+)?\/?(\?|$)/i.test(url),
  },
  {
    kind: 'wmts',
    test: (url) =>
      /service=wmts/i.test(url) || /\/wmts\b/i.test(url),
  },
  {
    kind: 'wms',
    test: (url) =>
      /service=wms/i.test(url) || /\/wms\b/i.test(url),
  },
  {
    kind: 'wfs',
    test: (url) =>
      /service=wfs/i.test(url) || /\/wfs\b/i.test(url),
  },
  {
    kind: 'wcs',
    test: (url) =>
      /service=wcs/i.test(url) || /\/wcs\b/i.test(url),
  },
  {
    kind: 'geojson',
    test: (url) => /\.geojson(\?|$)/i.test(url) || /\.json(\?|$)/i.test(url),
  },
  {
    kind: 'vector-tile',
    test: (url) => /\.pbf/i.test(url) || /\.mvt/i.test(url),
  },
  {
    kind: 'xyz-tile',
    test: (url) =>
      /\{[xyz]\}/i.test(url) ||
      /\/tile\//i.test(url) ||
      /\/tiles\//i.test(url),
  },
]

/** Detect the layer kind from a URL. Returns null if no pattern matches. */
export function detectSourceType(url: string): LayerKind | null {
  if (!url.trim()) return null
  for (const detector of detectors) {
    if (detector.test(url)) return detector.kind
  }
  return null
}
