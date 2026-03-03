import type { LayerPredicate, LayerRegistryEntry, LayerRenderer } from './types'
import type { LayerDefinition } from '../types/layer.types'

export class LayerRegistry {
  private entries: Array<LayerRegistryEntry> = []

  register(
    id: string,
    predicate: LayerPredicate,
    renderer: LayerRenderer,
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

  resolve(layer: LayerDefinition): LayerRegistryEntry {
    const entry = this.entries.find((e) => e.predicate(layer))
    if (!entry) {
      throw new Error(
        `No renderer registered for layer kind="${layer.kind}" (id="${layer.id}")`,
      )
    }
    return entry
  }

  canHandle(layer: LayerDefinition): boolean {
    return this.entries.some((e) => e.predicate(layer))
  }

  listRegistrations(): Array<string> {
    return this.entries.map((e) => e.id)
  }
}
