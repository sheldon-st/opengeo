import { createStore } from 'zustand/vanilla'
import { subscribeWithSelector } from 'zustand/middleware'
import * as persistence from './persistence'
import type { LayerDefinition } from '../types/layer.types'
import type { FeatureDefinition } from '../types/feature.types'
import type { MapViewState } from '../types/map.types'

export interface MapStoreState {
  layers: Record<string, LayerDefinition>
  features: Record<string, FeatureDefinition>
  view: MapViewState
  selectedFeatureIds: Array<string>
  baseLayer: LayerDefinition | null
  isHydrated: boolean
  isLoading: boolean

  addLayer: (layer: LayerDefinition) => void
  updateLayer: (id: string, patch: Partial<LayerDefinition>) => void
  removeLayer: (id: string) => void
  setLayerVisibility: (id: string, visible: boolean) => void
  setLayerOpacity: (id: string, opacity: number) => void
  reorderLayer: (
    id: string,
    newSortOrder: number,
    parentId: string | null,
  ) => void

  addFeature: (feature: FeatureDefinition) => void
  updateFeature: (id: string, patch: Partial<FeatureDefinition>) => void
  removeFeature: (id: string) => void
  setFeatureSelection: (featureIds: Array<string>) => void

  setView: (view: Partial<MapViewState>) => void
  setBaseLayer: (layer: LayerDefinition | null) => void

  hydrate: () => Promise<void>
}

const DEFAULT_VIEW: MapViewState = {
  center: [0, 0],
  zoom: 2,
  rotation: 0,
  projection: 'EPSG:3857',
}

export type MapStore = ReturnType<typeof createMapStore>

export function createMapStore(initialView?: Partial<MapViewState>) {
  return createStore<MapStoreState>()(
    subscribeWithSelector((set, get) => ({
      layers: {},
      features: {},
      view: { ...DEFAULT_VIEW, ...initialView },
      selectedFeatureIds: [],
      baseLayer: null,
      isHydrated: false,
      isLoading: false,

      addLayer: (layer) => {
        set((s) => ({
          layers: { ...s.layers, [layer.id]: layer },
        }))
        persistence.persistLayer(layer)
      },

      updateLayer: (id, patch) => {
        set((s) => {
          const existing = s.layers[id]
          if (!existing) return s
          const updated = {
            ...existing,
            ...patch,
            updatedAt: Date.now(),
          } as LayerDefinition
          return { layers: { ...s.layers, [id]: updated } }
        })
        const updated = get().layers[id]
        if (updated) persistence.persistLayer(updated)
      },

      removeLayer: (id) => {
        // Collect all descendants before mutating state
        const allLayers = get().layers
        const toRemove = new Set<string>([id])
        let changed = true
        while (changed) {
          changed = false
          for (const layer of Object.values(allLayers)) {
            if (layer.parentId != null && toRemove.has(layer.parentId) && !toRemove.has(layer.id)) {
              toRemove.add(layer.id)
              changed = true
            }
          }
        }
        set((s) => {
          const newLayers = { ...s.layers }
          for (const cid of toRemove) delete newLayers[cid]
          return { layers: newLayers }
        })
        for (const cid of toRemove) persistence.removePersistedLayer(cid)
      },

      setLayerVisibility: (id, visible) => {
        get().updateLayer(id, { visible })
      },

      setLayerOpacity: (id, opacity) => {
        get().updateLayer(id, { opacity })
      },

      reorderLayer: (id, newSortOrder, parentId) => {
        get().updateLayer(id, { sortOrder: newSortOrder, parentId })
      },

      addFeature: (feature) => {
        set((s) => ({
          features: { ...s.features, [feature.id]: feature },
        }))
        persistence.persistFeature(feature)
      },

      updateFeature: (id, patch) => {
        set((s) => {
          const existing = s.features[id]
          if (!existing) return s
          const updated = { ...existing, ...patch, updatedAt: Date.now() }
          return { features: { ...s.features, [id]: updated } }
        })
        const updated = get().features[id]
        if (updated) persistence.persistFeature(updated)
      },

      removeFeature: (id) => {
        set((s) => {
          const { [id]: _removed, ...rest } = s.features
          return { features: rest }
        })
        persistence.removePersistedFeature(id)
      },

      setFeatureSelection: (featureIds) => {
        set({ selectedFeatureIds: featureIds })
      },

      setView: (viewPatch) => {
        set((s) => ({
          view: { ...s.view, ...viewPatch },
        }))
      },

      setBaseLayer: (layer) => {
        set({ baseLayer: layer })
        persistence.persistBaseLayer(layer)
      },

      hydrate: async () => {
        set({ isLoading: true })
        try {
          const data = await persistence.hydrate()
          const layers: Record<string, LayerDefinition> = {}
          for (const l of data.layers) layers[l.id] = l
          const features: Record<string, FeatureDefinition> = {}
          for (const f of data.features) features[f.id] = f
          set({
            layers,
            features,
            view: data.mapState?.view ?? get().view,
            selectedFeatureIds: data.mapState?.selectedFeatureIds ?? [],
            baseLayer: data.mapState?.baseLayer ?? null,
            isHydrated: true,
            isLoading: false,
          })
        } catch (err) {
          console.error('Failed to hydrate map store:', err)
          set({ isHydrated: true, isLoading: false })
        }
      },
    })),
  )
}
