import type {
  FeaturePredicate,
  FeatureRegistryEntry,
  FeatureRenderer,
} from './types'
import type { FeatureDefinition } from '../types/feature.types'

export class FeatureRegistry {
  private entries: Array<FeatureRegistryEntry> = []

  register(
    id: string,
    predicate: FeaturePredicate,
    renderer: FeatureRenderer,
    priority = 0,
  ): void {
    this.entries = this.entries.filter((e) => e.id !== id)
    this.entries.push({ id, predicate, renderer, priority })
    this.entries.sort((a, b) => b.priority - a.priority)
  }

  unregister(id: string): boolean {
    const len = this.entries.length
    this.entries = this.entries.filter((e) => e.id !== id)
    return this.entries.length < len
  }

  resolve(feature: FeatureDefinition): FeatureRegistryEntry {
    const entry = this.entries.find((e) => e.predicate(feature))
    if (!entry) {
      throw new Error(
        `No renderer registered for feature (id="${feature.id}", layerId="${feature.layerId}")`,
      )
    }
    return entry
  }

  canHandle(feature: FeatureDefinition): boolean {
    return this.entries.some((e) => e.predicate(feature))
  }
}
