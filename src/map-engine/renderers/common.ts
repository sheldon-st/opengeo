import type OlBaseLayer from 'ol/layer/Base'
import type { LayerDefinition } from '../types/layer.types'

export function applyCommonLayerProps(
  olLayer: OlBaseLayer,
  layer: LayerDefinition,
): void {
  olLayer.setVisible(layer.visible)
  olLayer.setOpacity(layer.opacity)
  olLayer.setZIndex(layer.zIndex)
  if (layer.minResolution !== undefined)
    olLayer.setMinResolution(layer.minResolution)
  if (layer.maxResolution !== undefined)
    olLayer.setMaxResolution(layer.maxResolution)
  if (layer.minZoom !== undefined) olLayer.setMinZoom(layer.minZoom)
  if (layer.maxZoom !== undefined) olLayer.setMaxZoom(layer.maxZoom)
}

export function updateCommonLayerProps(
  olLayer: OlBaseLayer,
  next: LayerDefinition,
): void {
  olLayer.setVisible(next.visible)
  olLayer.setOpacity(next.opacity)
  olLayer.setZIndex(next.zIndex)
}
