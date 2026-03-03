import { buffer, getCenter, getHeight, getWidth, isEmpty } from 'ol/extent'

export type Extent = [number, number, number, number]

export function extentCenter(extent: Extent): [number, number] {
  return getCenter(extent) as [number, number]
}

export function extentWidth(extent: Extent): number {
  return getWidth(extent)
}

export function extentHeight(extent: Extent): number {
  return getHeight(extent)
}

export function isExtentEmpty(extent: Extent): boolean {
  return isEmpty(extent)
}

export function bufferExtent(extent: Extent, value: number): Extent {
  return buffer(extent, value) as Extent
}

export function mergeExtents(a: Extent, b: Extent): Extent {
  return [
    Math.min(a[0], b[0]),
    Math.min(a[1], b[1]),
    Math.max(a[2], b[2]),
    Math.max(a[3], b[3]),
  ]
}
