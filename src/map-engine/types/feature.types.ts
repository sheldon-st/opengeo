import type { Geometry } from './geometry.types'
import type { FeatureStyle } from './style.types'

export interface FeatureDefinition {
  id: string
  layerId: string
  geometry: Geometry
  properties: Record<string, unknown>
  style?: FeatureStyle
  visible: boolean
  selected: boolean
  createdAt: number
  updatedAt: number
}

export type FeatureInput = Omit<
  FeatureDefinition,
  'id' | 'createdAt' | 'updatedAt' | 'selected'
> & {
  id?: string
}
