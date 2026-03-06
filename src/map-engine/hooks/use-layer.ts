import { useCallback } from 'react'
import { useMapEngine, useMapStore } from '../components/map-provider'
import type { FilterExpression } from '../types/filter.types'
import type { LayerDefinition } from '../types/layer.types'

export function useLayer(id: string) {
  const engine = useMapEngine()
  const layer = useMapStore((s) => s.layers[id]) as LayerDefinition | undefined

  const setVisibility = useCallback(
    (visible: boolean) => engine.updateLayer(id, { visible }),
    [engine, id],
  )

  const setOpacity = useCallback(
    (opacity: number) => engine.updateLayer(id, { opacity }),
    [engine, id],
  )

  const remove = useCallback(() => engine.removeLayer(id), [engine, id])

  const setFilter = useCallback(
    (filter: FilterExpression | undefined) =>
      engine.updateLayer(id, { filter }),
    [engine, id],
  )

  return { layer, setVisibility, setOpacity, remove, setFilter }
}
