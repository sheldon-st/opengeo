import { createContext, useContext, useEffect, useRef } from 'react'
import { useStore } from 'zustand'
import { MapEngine } from '../engine/map-engine'
import type { MapConfig } from '../types/map.types'
import type { MapStore, MapStoreState } from '../store/map-store'

interface MapEngineContextValue {
  engine: MapEngine
  store: MapStore
}

const MapEngineContext = createContext<MapEngineContextValue | null>(null)

export function MapProvider({
  config,
  children,
}: {
  config: MapConfig
  children: React.ReactNode
}) {
  const engineRef = useRef<MapEngine | null>(null)

  if (!engineRef.current) {
    engineRef.current = new MapEngine(config)
  }

  useEffect(() => {
    return () => {
      engineRef.current?.dispose()
    }
  }, [])

  return (
    <MapEngineContext.Provider
      value={{
        engine: engineRef.current,
        store: engineRef.current.store,
      }}
    >
      {children}
    </MapEngineContext.Provider>
  )
}

export function useMapEngine(): MapEngine {
  const ctx = useContext(MapEngineContext)
  if (!ctx) throw new Error('useMapEngine must be used within a MapProvider')
  return ctx.engine
}

export function useMapStore<T>(selector: (state: MapStoreState) => T): T {
  const ctx = useContext(MapEngineContext)
  if (!ctx) throw new Error('useMapStore must be used within a MapProvider')
  return useStore(ctx.store, selector)
}
