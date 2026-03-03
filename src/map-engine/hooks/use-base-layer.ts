import { useMapEngine, useMapStore } from '../components/map-provider'
import {
  BASE_LAYER_PRESETS,
  getActivePresetId,
} from '../presets/base-layers'
import type { BaseLayerPresetId } from '../presets/base-layers'
import type { LayerDefinition } from '../types/layer.types'

export function useBaseLayer() {
  const engine = useMapEngine()
  const baseLayer = useMapStore((s) => s.baseLayer)
  const activePresetId = getActivePresetId(baseLayer)

  return {
    baseLayer,
    activePresetId,
    presets: BASE_LAYER_PRESETS,
    setPreset: (presetId: BaseLayerPresetId | null) => {
      if (presetId === null) {
        engine.clearBaseLayer()
        return
      }
      const preset = BASE_LAYER_PRESETS.find((p) => p.id === presetId)
      if (preset) engine.setBaseLayer(preset.createLayer())
    },
    setBaseLayer: (layer: LayerDefinition | null) => engine.setBaseLayer(layer),
    clearBaseLayer: () => engine.clearBaseLayer(),
  }
}
