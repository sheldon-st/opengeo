import { create } from 'zustand'
import type { DataSource } from './types'
import * as persistence from './persistence'

interface DataSourceStoreState {
  sources: DataSource[]
  isHydrated: boolean
  hydrate: () => Promise<void>
  add: (source: DataSource) => void
  remove: (id: string) => void
}

export const useDataSourceStore = create<DataSourceStoreState>((set, get) => ({
  sources: [],
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) return
    const sources = await persistence.getAllSources()
    set({ sources, isHydrated: true })
  },

  add: (source) => {
    set((state) => ({ sources: [...state.sources, source] }))
    persistence.addSource(source)
  },

  remove: (id) => {
    set((state) => ({ sources: state.sources.filter((s) => s.id !== id) }))
    persistence.removeSource(id)
  },
}))
