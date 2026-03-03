export interface MapViewState {
  center: [number, number]
  zoom: number
  rotation: number
  projection: string
}

export interface MapConfig {
  initialView: MapViewState
  targetId?: string
  maxZoom?: number
  minZoom?: number
  controls?: boolean
}
