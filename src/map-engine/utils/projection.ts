import { fromLonLat, toLonLat, transformExtent } from 'ol/proj'

export function lonLatToMapCoord(
  lonLat: [number, number],
  projection = 'EPSG:3857',
): [number, number] {
  return fromLonLat(lonLat, projection) as [number, number]
}

export function mapCoordToLonLat(
  coord: [number, number],
  projection = 'EPSG:3857',
): [number, number] {
  return toLonLat(coord, projection) as [number, number]
}

export function transformExtentBetween(
  extent: [number, number, number, number],
  from: string,
  to: string,
): [number, number, number, number] {
  return transformExtent(extent, from, to) as [number, number, number, number]
}
