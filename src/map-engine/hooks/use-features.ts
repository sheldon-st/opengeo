import { useMapStore } from '../components/map-provider'
import { selectFeaturesByLayerId } from '../store/selectors'
import type { FeatureDefinition } from '../types/feature.types'

export function useFeatures(layerId: string): Array<FeatureDefinition> {
  return useMapStore((s) => selectFeaturesByLayerId(s, layerId))
}

export function useAllFeatures(): Array<FeatureDefinition> {
  return useMapStore((s) => Object.values(s.features))
}
