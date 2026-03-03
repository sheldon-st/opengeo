import { useMapEngine, useMapStore } from '../components/map-provider'
import type { MapViewState } from '../types/map.types'

export function useMapView() {
  const engine = useMapEngine()
  const view = useMapStore((s) => s.view)

  return {
    ...view,
    setView: (v: Partial<MapViewState>) => engine.setView(v),
    zoomTo: (z: number) => engine.zoomTo(z),
    panTo: (c: [number, number]) => engine.panTo(c),
    fitExtent: (e: [number, number, number, number]) => engine.fitExtent(e),
  }
}
