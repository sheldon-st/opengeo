import VectorLayer from 'ol/layer/Vector'
import HeatmapLayer from 'ol/layer/Heatmap'
import ClusterSource from 'ol/source/Cluster'
import type VectorSource from 'ol/source/Vector'
import type OlBaseLayer from 'ol/layer/Base'
import type { LayerDefinition, VectorLayerBase } from '../types/layer.types'

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

/**
 * Constructs the correct OL layer type for a vector layer based on
 * `layer.vectorRenderer`:
 * - `'default'` (or omitted) → `VectorLayer`
 * - `'heatmap'` → `HeatmapLayer`
 * - `'cluster'` → `VectorLayer` with a `ClusterSource` wrapping the source
 */
export function buildVectorOlLayer(
  vectorSource: VectorSource,
  layer: VectorLayerBase,
): OlBaseLayer {
  const common = {
    visible: layer.visible,
    opacity: layer.opacity,
    zIndex: layer.zIndex,
    minResolution: layer.minResolution,
    maxResolution: layer.maxResolution,
    minZoom: layer.minZoom,
    maxZoom: layer.maxZoom,
    properties: { domainLayerId: layer.id },
  }

  const cfg = layer.vectorRenderer ?? { kind: 'default' }

  if (cfg.kind === 'heatmap') {
    return new HeatmapLayer({
      ...common,
      source: vectorSource,
      blur: cfg.blur ?? 15,
      radius: cfg.radius ?? 8,
      ...(cfg.gradient ? { gradient: cfg.gradient } : {}),
      ...(cfg.weightProperty ? { weight: cfg.weightProperty } : {}),
    })
  }

  if (cfg.kind === 'cluster') {
    const clusterSource = new ClusterSource({
      source: vectorSource,
      distance: cfg.distance ?? 40,
      minDistance: cfg.minDistance ?? 0,
    })
    return new VectorLayer({ ...common, source: clusterSource })
  }

  return new VectorLayer({ ...common, source: vectorSource })
}

/**
 * Disposes the OL layer's source(s). Handles the cluster case where both the
 * `ClusterSource` and its inner `VectorSource` need to be disposed.
 */
export function disposeVectorOlLayer(olLayer: OlBaseLayer): void {
  const src = (olLayer as VectorLayer).getSource()
  if (src instanceof ClusterSource) {
    src.getSource()?.dispose()
    src.dispose()
  } else {
    src?.dispose()
  }
}
